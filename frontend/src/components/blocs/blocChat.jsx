import { io } from 'socket.io-client';
import { useState, useEffect, useRef } from 'react';
import { SOCKET_BASE_URL } from '../../api/base';
import "../../assets/styles/chat.scss"
import { obtenirPlusDeMessages } from '../../api/api_chat';
import { Form, InputGroup, ListGroup } from 'react-bootstrap';
import { useProtected } from '../../Protected';
import { Link } from 'react-router-dom';
import BlocTemplate from '../templates/BlocTemplate';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '../../api/api_utilisateurs';
import { normaliserResultats, useDebounce } from '../elements/Autocompletion';

// Au-delà de ce délai, on réaffiche l'en-tête même si c'est le même auteur
const DELAI_GROUPE_MS = 5 * 60 * 1000;

// Vrai si le message fait suite à un message du même auteur, envoyé récemment
const estSuite = (msg, precedent) =>
  !!precedent &&
  precedent.author_id === msg.author_id &&
  new Date(msg.time) - new Date(precedent.time) < DELAI_GROUPE_MS;

const REGEX_SPLIT_MENTION = /(@\[\d+\|[^\]]+\])/;
const REGEX_TOKEN_MENTION = /^@\[(\d+)\|([^\]]+)\]$/;
const echapperRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Détecte si le curseur est dans un "@mot" en cours de saisie
const detecterMention = (texte, curseur) => {
  const avant = texte.slice(0, curseur);
  const m = avant.match(/(^|\s)@([^\s@]*)$/);
  if (!m) return null;
  return { debut: m.index + m[1].length, requete: m[2] };
};

// "@jdupont" -> "@[42|jdupont]" pour les utilisateurs choisis dans la liste
const encoderMentions = (texte, mentions) => {
  let resultat = texte;
  [...mentions]
    .sort((a, b) => b.label.length - a.label.length)
    .forEach(({ id, label }) => {
      const re = new RegExp(`@${echapperRegex(label)}(?![\\w-])`, 'g');
      resultat = resultat.replace(re, `@[${id}|${label}]`);
    });
  return resultat;
};

// Transforme les "@[id|nom]" en liens vers la page de l'utilisateur
const rendreTexte = (texte, userId) =>
  texte.split(REGEX_SPLIT_MENTION).map((morceau, i) => {
    const m = morceau.match(REGEX_TOKEN_MENTION);
    if (!m) return morceau;
    const id = Number(m[1]);
    return (
      <Link
        key={i}
        to={`/utilisateur/${id}`}
        className={`chat-mention ${id === userId ? "chat-mention-me" : ""}`}
      >
        @{m[2]}
      </Link>
    );
  });

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

  const [mention, setMention] = useState(null);            // { debut, requete }
  const [mentionsChoisies, setMentionsChoisies] = useState([]); // [{ id, label }]
  const [indexActif, setIndexActif] = useState(0);
  const inputRef = useRef(null);

  const requeteDebounced = useDebounce(mention?.requete ?? '');
  const { data: suggestions = [] } = useQuery({
    queryKey: ['mentionUtilisateurs', requeteDebounced],
    queryFn: () => searchUsers({ query: requeteDebounced, limit: 6 }).then(normaliserResultats).then(liste => liste.filter(u => u.nom_utilisateur)),
    enabled: mention !== null && requeteDebounced.length >= 1,
  });

  const listeOuverte = mention !== null && requeteDebounced.length >= 1 && suggestions.length > 0;
  const indexValide = Math.min(indexActif, Math.max(suggestions.length - 1, 0));

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

    const message = { text: encoderMentions(input.trim(), mentionsChoisies) };
    if (socketRef.current) {
      socketRef.current.emit("message", message);
    }
    setInput("");
    setMention(null);
    setMentionsChoisies([]);

    const messageDisplay = messageDisplayRef.current;
    if (messageDisplay) {
      isAtBottomRef.current = true;
      messageDisplay.scrollTop = messageDisplay.scrollHeight;
    }
  };

  const handleInputChange = (e) => {
    const valeur = e.target.value;
    setInput(valeur);
    setMention(detecterMention(valeur, e.target.selectionStart));
    setIndexActif(0);
  };

  const choisirMention = (utilisateur) => {
    if (!mention) return;
    const label = utilisateur.nom_utilisateur;
    const curseur = inputRef.current?.selectionStart ?? input.length;
    const avant = input.slice(0, mention.debut);
    const apres = input.slice(curseur);
    const insertion = `@${label} `;

    setInput(avant + insertion + apres);
    setMentionsChoisies(prev =>
      prev.some(m => m.id === utilisateur.id) ? prev : [...prev, { id: utilisateur.id, label }]
    );
    setMention(null);

    const position = (avant + insertion).length;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(position, position);
    });
  };

  const handleKeyDown = (e) => {
    if (listeOuverte) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndexActif(i => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndexActif(i => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        choisirMention(suggestions[indexValide]);
        return;
      }
      if (e.key === "Escape") {
        setMention(null);
        return;
      }
    }
    if (e.key === "Enter") sendMessage();
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
  >
    <div ref={messageDisplayRef} id="message-display" className="overflow-auto mb-1" onScroll={handleScroll}>
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
                <span>{rendreTexte(msg.text, userData.id)}</span>
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
                <div>{rendreTexte(msg.text, userData.id)}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
      <div className="position-relative">
        {listeOuverte && (
          <ListGroup className="chat-mention-liste shadow-sm">
            {suggestions.map((u, i) => (
              <ListGroup.Item
                key={u.id}
                action
                className={i === indexValide ? "chat-mention-actif" : ""}
                ref={i === indexValide ? (el) => el?.scrollIntoView({ block: "nearest" }) : null}
                onMouseEnter={() => setIndexActif(i)}
                onMouseDown={(e) => { e.preventDefault(); choisirMention(u); }}
              >
                @{u.nom_utilisateur}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
        <InputGroup>
          <Form.Control className="chat-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Parle moi !!!"
          />
        </InputGroup>
      </div>
    </BlocTemplate>;
}