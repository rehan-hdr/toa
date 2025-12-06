import React, { useState } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import TaskList from './components/TaskList';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [conversationId, setConversationId] = useState(null);

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      conversationId={conversationId}
      setConversationId={setConversationId}
    >
      {activeTab === 'chat' ? (
        <ChatInterface 
          conversationId={conversationId} 
          setConversationId={setConversationId}
        />
      ) : (
        <TaskList />
      )}
    </Layout>
  );
}

export default App;
