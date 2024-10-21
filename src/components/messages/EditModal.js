import React, { useState } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';

const REPLACEMENT_STRINGS = [
    '업체명', '업체연락처', '업체주소', '예약자명', '예약번호', '변경객실정보', 
    '예약웹링크', '입실일시', '퇴실일시', '객실단가', '0박0일', '예약OTA명', '업체계좌번호'
];

const EditModal = ({ template, onClose, onSave }) => {
    const [title, setTitle] = useState(template ? template.title : '');
    const [content, setContent] = useState(template ? template.content : '');

    const handleSave = () => {
        onSave({ id: template ? template.id : null, title, content });
    };

    const insertReplacementString = (str) => {
        setContent(prev => prev + `[${str}]`);
    };

    return (
        <ModalOverlay>
            <ModalContent>
                <h2>{template ? '템플릿 수정' : '문자 템플릿 신규등록'}</h2>
                <InputLabel>템플릿 제목</InputLabel>
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="템플릿 제목"
                />
                <InputLabel>메시지 내용</InputLabel>
                <TextArea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="메시지 내용을 입력하세요"
                />
                <CharCount>{content.length}/600</CharCount>
                <ReplacementSection>
                    <InputLabel>치환 문자열</InputLabel>
                    <ReplacementButtons>
                        {REPLACEMENT_STRINGS.map((str, index) => (
                            <ReplacementButton key={index} onClick={() => insertReplacementString(str)}>
                                {str}
                            </ReplacementButton>
                        ))}
                    </ReplacementButtons>
                </ReplacementSection>
                <ButtonGroup>
                    <CancelButton onClick={onClose}>취소</CancelButton>
                    <SaveButton onClick={handleSave}>등록</SaveButton>
                </ButtonGroup>
            </ModalContent>
        </ModalOverlay>
    );
};

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; // 높은 z-index 값 추가
`;

const ModalContent = styled.div`
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
`;

const InputLabel = styled.label`
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
`;

const Input = styled.input`
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-sizing: border-box;
`;

const TextArea = styled.textarea`
    width: 100%;
    height: 150px;
    padding: 10px;
    margin-bottom: 5px;
    border: 1px solid #ddd;
    border-radius: 5px;
    resize: vertical;
    box-sizing: border-box;
`;

const CharCount = styled.div`
    text-align: right;
    margin-bottom: 15px;
    font-size: 0.8em;
    color: #666;
`;

const ReplacementSection = styled.div`
    margin-bottom: 15px;
    width: 100%;
`;

const ReplacementButtons = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
`;

const ReplacementButton = styled.button`
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 5px 10px;
    font-size: 0.9em;
    cursor: pointer;

    &:hover {
        background-color: #e0e0e0;
    }

    
`;

const ButtonGroup = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
`;

const Button = styled.button`
    padding: 10px 20px;
    width: 100px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
`;

const CancelButton = styled(Button)`
    background-color: #ffffff;
    color: #1c1c1e;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #ddd;

    &:hover {
        background-color: #f0f0f0;
    }
`;

const SaveButton = styled(Button)`
    background-color: #007AFF;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background-color: #0056b3;
    }
`;

export default EditModal;
