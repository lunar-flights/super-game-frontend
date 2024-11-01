import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';

interface Message {
  sender: string;
  text: string;
  color: string;
}

interface ChatProps {
  playerColor: string;
  playerName: string;
}

const Chat: React.FC<ChatProps> = ({ playerColor, playerName }) => {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChatVisibility = () => {
    setIsChatVisible(!isChatVisible);
  };

  const handleSendMessage = () => {
    if (messageText.trim() === '') return;

    const newMessage: Message = {
      sender: playerName,
      text: messageText,
      color: playerColor,
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
  };

  useEffect(() => {
    if (isChatVisible && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatVisible]);

  return (
    <div>
      {!isChatVisible && (
        <button className="chat-toggle-button" onClick={toggleChatVisibility}>
          Show Chat
        </button>
      )}
      {isChatVisible && (
        <div className="chat-container">
          <div className="chat-header">
            <span>Chat</span>
            <button className="chat-hide-button" onClick={toggleChatVisibility}>
              Hide
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <p key={index}>
                <span style={{ color: msg.color }}>[{msg.sender}]</span> {msg.text}
              </p>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-container">
            <textarea
              value={messageText}
              onChange={handleMessageInputChange}
              placeholder="Type a message..."
            ></textarea>
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;