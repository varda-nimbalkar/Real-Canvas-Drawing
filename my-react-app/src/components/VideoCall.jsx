// src/components/VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * VideoCall component
 *
 * Flow:
 * - Each client generates a local clientId (uuid).
 * - Caller: click "Start Call" -> sends {type: "call_request", from: clientId}
 * - Other clients receive call_request -> show incoming popup + ringtone
 * - If a client accepts -> it sends {type: "call_accept", from: calleeId, to: callerId}
 * - Caller receives call_accept -> creates RTCPeerConnection, adds local stream, creates offer -> sends {type:"offer", offer, from:callerId, to:calleeId}
 * - Callee receives offer -> sets remote desc, gets local stream, adds tracks, creates answer -> sends {type:"answer", answer, from:calleeId, to:callerId}
 * - Caller receives answer -> sets remote desc -> WebRTC connection establishes
 * - Both exchange ICE candidates (type: "candidate") with from/to fields.
 *
 * Notes:
 * - The backend must forward websocket messages to other clients in room (router currently does that).
 * - This component filters incoming messages by `to` (if present) so only the intended recipient handles them.
 * - Live captions use the browser SpeechRecognition API (falls back to message if unsupported).
 * - Ringtone is implemented via WebAudio oscillator for portability (no external file).
 */

const VideoCall = ({ roomId }) => {
  // refs / state
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const ringtoneRef = useRef(null);

  const [clientId] = useState(() => uuidv4()); // persistent for component lifetime
  const [incomingCaller, setIncomingCaller] = useState(null); // callerId that is calling us
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [caption, setCaption] = useState("Captions will appear here...");
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);

  // helper: send websocket message (adds from / optional to)
  const wsSend = (obj) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ ...obj, from: clientId }));
  };

  // Start ringtone using WebAudio (looped beep)
  const startRingtone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 900;
      g.gain.value = 0.0015; // low volume
      o.connect(g);
      g.connect(ctx.destination);

      o.start();
      // ramp up slightly and pulse
      let on = true;
      const interval = setInterval(() => {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(on ? 0.0015 : 0.0001, ctx.currentTime);
        on = !on;
      }, 300);

      ringtoneRef.current = { ctx, osc: o, gain: g, interval };
    } catch (e) {
      console.warn("Ringtone start failed:", e);
    }
  };

  // Stop ringtone
  const stopRingtone = () => {
    try {
      const r = ringtoneRef.current;
      if (!r) return;
      clearInterval(r.interval);
      r.osc.stop();
      r.gain.disconnect();
      r.ctx.close?.();
      ringtoneRef.current = null;
    } catch (e) {
      console.warn("Ringtone stop failed:", e);
    }
  };

  // Start browser SpeechRecognition for live captions
  const startCaptions = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setCaption("Live captions not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      // assemble last result
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) interim = r[0].transcript;
        else interim = r[0].transcript; // show interim as well
      }
      setCaption(interim);
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsCaptionsOn(true);
  };

  const stopCaptions = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setIsCaptionsOn(false);
    setCaption("Captions will appear here...");
  };

  // Create a new RTCPeerConnection and wire candidates / tracks
  const createPeerConnection = (onTrackCallback) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // add TURN if you deploy publicly
      ],
    });

    // send ICE candidates over ws with to/from
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsSend({ type: "candidate", candidate: event.candidate, to: pc._remoteId || null });
      }
    };

    pc.ontrack = (event) => {
      if (onTrackCallback) onTrackCallback(event);
    };

    return pc;
  };

  // Start a call -> send call_request, wait for call_accept from someone
  const initiateCall = () => {
    // send call request to the room; backend should forward to others
    wsSend({ type: "call_request" });
    // caller waits for call_accept; UI could show "calling..."
    console.log("Call request sent, waiting for accept...");
  };

  // Accept incoming call (callee action)
  const acceptCall = async () => {
    stopRingtone();
    setShowIncoming(falseFlag); // we will define setter below; but we'll just setShowIncomingModal false
  };

  // We'll implement accept flow inline below to handle offer/answer pattern.

  // WebSocket setup and message handling
  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/video/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Video WS connected", roomId, clientId);
    };

    ws.onmessage = async (evt) => {
      let data;
      try {
        data = JSON.parse(evt.data);
      } catch (e) {
        console.warn("Invalid WS message", evt.data);
        return;
      }

      // If message has a 'to' and it's not for me, ignore
      if (data.to && data.to !== clientId) return;

      const { type, from } = data;

      switch (type) {
        case "call_request":
          // Someone is calling — show incoming UI + ringtone
          if (!isCallActive) {
            setIncomingCaller(from);
            setShowIncomingModal(true);
            startRingtone();
          }
          break;

        case "call_accept":
          // A callee accepted our request -> `from` is callee id
          // If we (caller) receive this, create offer and proceed
          if (!isCallActive) {
            const calleeId = from;
            // create pc, get local media, create offer
            pcRef.current = createPeerConnection((event) => {
              remoteVideoRef.current.srcObject = event.streams[0];
            });
            pcRef.current._remoteId = calleeId;

            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              localStreamRef.current = stream;
              localVideoRef.current.srcObject = stream;
              stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));
            } catch (err) {
              console.error("Could not get local media:", err);
              return;
            }

            // create offer
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            wsSend({ type: "offer", offer, to: calleeId });
            setIsCallActive(true);
            startCaptions();
          }
          break;

        case "offer":
          // Received an offer (callee receives this if caller skipped call_request flow OR caller created offer)
          if (!isCallActive) {
            const callerId = from;
            pcRef.current = createPeerConnection((event) => {
              remoteVideoRef.current.srcObject = event.streams[0];
            });
            pcRef.current._remoteId = callerId;

            // set remote descr, add local tracks, create answer
            try {
              await pcRef.current.setRemoteDescription(data.offer);

              const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              localStreamRef.current = stream;
              localVideoRef.current.srcObject = stream;
              stream.getTracks().forEach((track) => pcRef.current.addTrack(track, stream));

              const answer = await pcRef.current.createAnswer();
              await pcRef.current.setLocalDescription(answer);

              wsSend({ type: "answer", answer, to: callerId });
              setIsCallActive(true);
              startCaptions();
            } catch (err) {
              console.error("Error handling offer:", err);
            }
          }
          break;

        case "answer":
          // Caller receives answer -> set remote description
          if (pcRef.current && data.answer) {
            try {
              await pcRef.current.setRemoteDescription(data.answer);
            } catch (err) {
              console.error("Error setting remote answer:", err);
            }
          }
          break;

        case "candidate":
          if (pcRef.current && data.candidate) {
            try {
              await pcRef.current.addIceCandidate(data.candidate);
            } catch (err) {
              console.warn("Error adding candidate", err);
            }
          }
          break;

        case "call_reject":
          // Caller gets rejection
          if (!isCallActive) {
            console.log("Call was rejected by:", from);
            // show UI message if you want
          }
          break;

        default:
          console.warn("Unknown video WS message type:", type);
      }
    };

    ws.onclose = () => {
      console.log("Video WS closed");
    };

    ws.onerror = (err) => {
      console.error("Video WS error:", err);
    };

    // cleanup
    return () => {
      stopRingtone();
      stopCaptions();
      try {
        ws.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, clientId, isCallActive]);

  // Accept incoming call (callee action) -> send call_accept (so caller proceeds)
  const acceptIncoming = async () => {
    if (!incomingCaller) return;
    stopRingtone();
    setShowIncomingModal(false);

    // Tell caller we accept
    wsSend({ type: "call_accept", to: incomingCaller });

    // The caller will createOffer and send offer -> this client will receive 'offer' and proceed
  };

  // Reject incoming call
  const rejectIncoming = () => {
    if (!incomingCaller) return;
    stopRingtone();
    setShowIncomingModal(false);
    wsSend({ type: "call_reject", to: incomingCaller });
    setIncomingCaller(null);
  };

  // Manual stop call button (closes pc and stops media + captions)
  const stopCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    stopCaptions();
    setIsCallActive(false);
  };

  // Mute/unmute
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  };

  // camera toggle
  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOn(track.enabled);
    }
  };

  // UI helpers
  const incomingModal = (
    <div style={modalStyles.backdrop}>
      <div style={modalStyles.modal}>
        <h3>Incoming Video Call</h3>
        <p>Caller: <strong>{incomingCaller}</strong></p>
        <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "center" }}>
          <button
            style={modalStyles.accept}
            onClick={() => {
              acceptIncoming();
            }}
          >
            Accept
          </button>
          <button style={modalStyles.reject} onClick={() => rejectIncoming()}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );

  // small UI for the component
  return (
    <div style={s.container}>
      <div style={s.videos}>
        <div>
          <div style={s.label}>You</div>
          <video ref={localVideoRef} autoPlay muted playsInline style={s.video} />
        </div>
        <div>
          <div style={s.label}>Remote</div>
          <video ref={remoteVideoRef} autoPlay playsInline style={s.video} />
        </div>
      </div>

      <div style={s.captionBox}>{caption}</div>

      <div style={s.controls}>
        {!isCallActive ? (
          <button style={s.startBtn} onClick={initiateCall}>
            Start Call (send request)
          </button>
        ) : (
          <>
            <button style={s.ctrlBtn} onClick={toggleMute}>
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button style={s.ctrlBtn} onClick={toggleCamera}>
              {isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
            </button>
            <button style={s.ctrlBtn} onClick={() => (isCaptionsOn ? stopCaptions() : startCaptions())}>
              {isCaptionsOn ? "Stop Captions" : "Start Captions"}
            </button>
            <button style={s.stopBtn} onClick={stopCall}>
              End Call
            </button>
          </>
        )}
      </div>

      {/* Incoming call modal */}
      {showIncomingModal && incomingModal}
    </div>
  );
};

// Styles
const s = {
  container: { textAlign: "center", width: "100%" },
  videos: { display: "flex", justifyContent: "center", gap: 16, marginBottom: 8 },
  video: { width: 260, height: 200, background: "#000", borderRadius: 8, objectFit: "cover" },
  label: { fontSize: 12, color: "#444", marginBottom: 6 },
  captionBox: {
    marginTop: 10,
    marginBottom: 8,
    padding: 8,
    background: "#111",
    color: "#00ff99",
    fontSize: 13,
    fontFamily: "monospace",
    borderRadius: 6,
    minHeight: 28,
  },
  controls: { display: "flex", justifyContent: "center", gap: 10, marginTop: 8 },
  startBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  ctrlBtn: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    padding: "8px 10px",
    borderRadius: 8,
    cursor: "pointer",
  },
  stopBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 10px",
    borderRadius: 8,
    cursor: "pointer",
  },
};

const modalStyles = {
  backdrop: {
    position: "fixed",
    right: 20,
    top: 20,
    zIndex: 9999,
  },
  modal: {
    width: 300,
    padding: 16,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 6px 30px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  accept: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  reject: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
};

export default VideoCall;
