import React from 'react';
import styled from 'styled-components';

const PhoneContainerWrapper = styled.div`
    width: 375px;
    height: 725px;
    border-radius: 30px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f7;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
`;

const PhoneScreen = styled.div`
    flex: 1;
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    padding-top: 30px; // title 공간 확보
`;

const AppHeader = styled.div`
    font-size: 20px;
    font-weight: 600;
    color: #1c1c1e;
    margin-bottom: 10px;
    text-align: center;
`;

const PhoneContainer = ({ title, children, className }) => {
    return (
        <PhoneContainerWrapper className={className}>
            <PhoneScreen>
                <AppHeader>{title}</AppHeader>
                {children}
            </PhoneScreen>
        </PhoneContainerWrapper>
    );
};

export default PhoneContainer;
