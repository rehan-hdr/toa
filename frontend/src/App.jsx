import React, { useState } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import TaskList from './components/TaskList';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'chat' ? <ChatInterface /> : <TaskList />}
    </Layout>
  );
}

export default App;
