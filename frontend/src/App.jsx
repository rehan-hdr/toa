import React, { useState } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import TaskList from './components/TaskList';
import NotesView from './components/NotesView';
import JournalView from './components/JournalView';
import MindMapView from './components/MindMapView';

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
      {activeTab === 'chat' && (
        <ChatInterface 
          conversationId={conversationId} 
          setConversationId={setConversationId}
        />
      )}
      {activeTab === 'tasks' && <TaskList />}
      {activeTab === 'notes' && <NotesView />}
      {activeTab === 'journal' && <JournalView />}
      {activeTab === 'graph' && <MindMapView />}
    </Layout>
  );
}

export default App;
