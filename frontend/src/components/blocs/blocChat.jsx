import { io } from 'socket.io-client';
import { useState, useEffect, useRef } from 'react';
import { SOCKET_BASE_URL } from '../../api/base';
import "../../assets/styles/chat.scss"
import { obtenirPlusDeMessages } from '../../api/api_chat';
import { Form, InputGroup } from 'react-bootstrap';
import { useProtected } from '../../Protected';
import { Link } from 'react-router-dom';
import BlocTemplate from '../templates/BlocTemplate';

// Au-delà de ce délai, on réaffiche l'en-tête même si c'est le même auteur
const DELAI_GROUPE_MS = 5 * 60 * 1000;

// Vrai si le message fait suite à un message du même auteur, envoyé récemment
const estSuite = (msg, precedent) =>
  !!precedent &&
  precedent.author_id === msg.author_id &&
  new Date(msg.time) - new Date(precedent.time) < DELAI_GROUPE_MS;

export default function BlocChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);

  // Refs for Scroll Management
  const messageDisplayRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const scrollHeightBeforeUpdateRef = useRef(0);
  const shouldCorrectScrollRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // Ref for Intersection Observer
  const firstMessageRef = useRef(null);

  const { userData } = useProtected();

  useEffect(() => {
    const newSocket = io(`${SOCKET_BASE_URL}`, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {

    });

    newSocket.on("message", (message) => {
      const messageDisplay = messageDisplayRef.current;
      // Check scroll position before state update to see if we should auto-scroll
      if (messageDisplay) {
        isAtBottomRef.current = messageDisplay.scrollHeight - messageDisplay.scrollTop <= messageDisplay.clientHeight + 1;
      }

      if (message.sound && message.text.trim().toLowerCase() === "piche" && message.author_id !== userData.id) {
        const audio = new Audio('/assets/sons/piche.wav');
        audio.play();
      }
      setMessages((prev) => [
        ...prev,
        { text: message.text, time: message.time, author: message.author, author_id: message.author_id, id: message.id }
      ]);
    });

    newSocket.on("disconnect", () => {

    });

    return () => {
      newSocket.disconnect();
    };
  }, [userData.id]);

  useEffect(() => {
    async function fetchInitialMessages() {
      const initial_messages = await obtenirPlusDeMessages(0);
      if (initial_messages && initial_messages.length > 0) {
        setMessages(initial_messages);
      }
    }
    fetchInitialMessages();
  }, []);

  useEffect(() => {
    const messageDisplay = messageDisplayRef.current;
    if (messageDisplay && messages.length > 0) {
      if (isInitialLoadRef.current) {
        // Force scroll to bottom only on the first load
        messageDisplay.scrollTop = messageDisplay.scrollHeight;
        isInitialLoadRef.current = false;
      } else if (isAtBottomRef.current) {
        // Auto-scroll when new messages arrive (socket updates)
        messageDisplay.scrollTop = messageDisplay.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const messageDisplay = messageDisplayRef.current;
    if (shouldCorrectScrollRef.current && messageDisplay) {
      const scrollHeightAfter = messageDisplay.scrollHeight;
      const scrollOffset = scrollHeightAfter - scrollHeightBeforeUpdateRef.current;
      messageDisplay.scrollTop = scrollOffset;

      shouldCorrectScrollRef.current = false;
    }
  }, [messages.length]);

  useEffect(() => {
    const messageDisplay = messageDisplayRef.current;
    const oldestMessage = firstMessageRef.current;

    if (oldestMessage && messageDisplay && !isInitialLoadRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            observer.unobserve(oldestMessage);

            const fetchNewMessages = async () => {
              // Record height before API call
              scrollHeightBeforeUpdateRef.current = messageDisplay.scrollHeight;

              const new_messages = await obtenirPlusDeMessages(messages[0].id);

              if (new_messages && new_messages.length > 0) {
                // Set flag and update state
                shouldCorrectScrollRef.current = true;
                setMessages([...new_messages, ...messages]);
              }
            };
            fetchNewMessages();
          }
        },
        { root: messageDisplay, threshold: 0.1 }
      );

      observer.observe(oldestMessage);

      return () => {
        if (oldestMessage) {
          observer.unobserve(oldestMessage);
        }
      };
    }
  }, [messages.length, messages, isInitialLoadRef]);

  const sendMessage = () => {
    if (!input.trim()) return;

    if (input.trim().toLowerCase() === "piche") {
      const audio = new Audio('/assets/sons/piche.wav');
      audio.play();
    }

    const message = { text: input };
    if (socketRef.current) {
      socketRef.current.emit("message", message);
    }
    setInput("");

    const messageDisplay = messageDisplayRef.current;
    if (messageDisplay) {
      isAtBottomRef.current = true;
      messageDisplay.scrollTop = messageDisplay.scrollHeight;
    }
  };

  const handleScroll = e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    isAtBottomRef.current = scrollHeight - scrollTop <= clientHeight + 1;
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleTimeString('fr-FR', { month: "numeric", day: "numeric", year: "2-digit", hour: '2-digit', minute: '2-digit' });
  }

  const formatHeure = (timeStr) => {
    if (!timeStr) return "";
    return new Date(timeStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  return <BlocTemplate
    titre="Chat"
    contenu={<><div ref={messageDisplayRef} id="message-display" className="overflow-auto mb-1" onScroll={handleScroll}>
      {messages.map((msg, idx) => {
        const suite = estSuite(msg, messages[idx - 1]);
        return (
          <div
            ref={idx === 0 ? firstMessageRef : null}
            key={msg.id || idx}
            className={`chat-message ${suite ? "chat-message-suite" : ""}`}
          >
            {suite ? (
              <div className="d-flex justify-content-between align-items-start">
                <span>{msg.text}</span>
                <span className="chat-heure-suite text-muted">{formatHeure(msg.time)}</span>
              </div>
            ) : (
              <>
                <div className="d-flex flex-row justify-content-between">
                  <b>
                    <Link
                      className={`interactive-link ${msg.author_id === userData.id ? "chat-author-me" : ""}`}
                      to={`/utilisateur/${msg.author_id}`}
                    >
                      {msg.author}
                    </Link>
                  </b>
                  <span className="text-muted">{formatTime(msg.time)}</span>
                </div>
                <div>{msg.text}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
      <InputGroup >
        <Form.Control className="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Parle moi !!!"
        />
      </InputGroup>
    </>
    } />;
}