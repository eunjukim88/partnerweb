import React from 'react';
import styled from 'styled-components';
import ManagerList from '../../src/components/managers/ManagerList';


const ManagersPage = () => {
    return (
        <PageContent>
            <PageTitle>담당자 관리</PageTitle>
            <ManagerList />
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

export default ManagersPage;