import React, { useState } from 'react';
import styled from 'styled-components';
import { TabMenu, TabButton } from '../../src/components/common/TabComponents';
import MessageSend from '../../src/components/messages/MessageSend';
import MessageTemplates from '../../src/components/messages/MessageTemplates';
import MessageSentList from '../../src/components/messages/MessageSentList';

const MessagesPage = () => {
    const [activeTab, setActiveTab] = useState('message-send');

    return (
        <PageContent>
            <PageTitle>문자 관리</PageTitle>
            <TabMenu>
                <TabButton 
                    active={activeTab === 'message-send'} 
                    onClick={() => setActiveTab('message-send')}
                >
                    문자 발송
                </TabButton>
                <TabButton 
                    active={activeTab === 'message-template'} 
                    onClick={() => setActiveTab('message-template')}
                >
                    문자 템플릿
                </TabButton>
                <TabButton 
                    active={activeTab === 'message-sentlist'} 
                    onClick={() => setActiveTab('message-sentlist')}
                >
                    발송 현황
                </TabButton>
            </TabMenu>
            {activeTab === 'message-send' && <MessageSend />}
            {activeTab === 'message-template' && <MessageTemplates />}
            {activeTab === 'message-sentlist' && <MessageSentList />}
        </PageContent>
    );
};

const PageContent = styled.div`
    padding: 20px;
`;

const PageTitle = styled.h1`
    font-size: 24px;
    margin-bottom: 20px;
`;

export default MessagesPage;