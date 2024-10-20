import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';

const TEMPLATES_PER_PAGE = 10;

const MessageTemplates = () => {
    const [templates, setTemplates] = useState([
        { id: 1, title: "체크인 안내", content: "안녕하세요. 예약하신 객실은 [객실번호]입니다. 체크인 시간은 [체크인시간]입니다." },
        { id: 2, title: "체크아웃 안내", content: "체크아웃 시간은 [체크아웃시간]입니다. 이용해 주셔서 감사합니다." },
        { id: 3, title: "객실 청소 완료", content: "객실 청소가 완료되었습니다. 편안한 휴식 되세요." },
        { id: 4, title: "주변 관광지 안내", content: "주변 관광지 안내: [관광지명]이 [거리]km 거리에 있습니다." },
        { id: 5, title: "아침 식사 안내", content: "아침 식사는 [시간]부터 [장소]에서 제공됩니다." },
        { id: 6, title: "와이파이 안내", content: "와이파이 비밀번호는 [비밀번호]입니다." },
        { id: 7, title: "미니바 이용 안내", content: "객실 내 미니바 이용 안내: [미니바 정보]" },
        { id: 8, title: "부대시설 이용 안내", content: "호텔 내 부대시설 이용 시간: [시설명] - [이용시간]" },
        { id: 9, title: "주차 안내", content: "주차 안내: [주차장 위치], 주차권은 프론트에서 받아가세요." },
        { id: 10, title: "늦은 체크아웃 안내", content: "늦은 체크아웃을 원하시면 프론트로 문의해 주세요." },
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const indexOfLastTemplate = currentPage * TEMPLATES_PER_PAGE;
    const indexOfFirstTemplate = indexOfLastTemplate - TEMPLATES_PER_PAGE;
    const currentTemplates = templates.slice(indexOfFirstTemplate, indexOfLastTemplate);

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setIsEditModalOpen(true);
    };

    const handleDeleteTemplate = (id) => {
        setTemplates(prev => prev.filter(template => template.id !== id));
    };

    return (
        <Container>
            <Header>
                <Button onClick={() => setIsEditModalOpen(true)}>신규 등록</Button>
            </Header>
            <TemplateGrid>
                {currentTemplates.map(template => (
                    <TemplateCard key={template.id}>
                        <CardTitle>{template.title}</CardTitle>
                        <MessageArea readOnly value={template.content} />
                        <ButtonGroup>
                            <EditButton onClick={() => handleEditTemplate(template)}>수정</EditButton>
                            <DeleteButton onClick={() => handleDeleteTemplate(template.id)}>삭제</DeleteButton>
                        </ButtonGroup>
                    </TemplateCard>
                ))}
            </TemplateGrid>
            <PaginationButtons>
                <PaginationButton 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                >
                    &lt;
                </PaginationButton>
                {Array.from({ length: Math.ceil(templates.length / TEMPLATES_PER_PAGE) }, (_, i) => i + 1).map(page => (
                    <PaginationButton
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        active={currentPage === page}
                    >
                        {page}
                    </PaginationButton>
                ))}
                <PaginationButton 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(templates.length / TEMPLATES_PER_PAGE)))} 
                    disabled={currentPage === Math.ceil(templates.length / TEMPLATES_PER_PAGE)}
                >
                    &gt;
                </PaginationButton>
            </PaginationButtons>
            {isEditModalOpen && (
                <EditModal
                    template={editingTemplate}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingTemplate(null);
                    }}
                    onSave={(updatedTemplate) => {
                        setTemplates(prev => 
                            editingTemplate
                                ? prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
                                : [...prev, { ...updatedTemplate, id: Date.now() }]
                        );
                        setIsEditModalOpen(false);
                        setEditingTemplate(null);
                    }}
                />
            )}
        </Container>
    );
};

const EditModal = ({ template, onClose, onSave }) => {
    const [title, setTitle] = useState(template ? template.title : '');
    const [content, setContent] = useState(template ? template.content : '');

    const handleSave = () => {
        onSave({ id: template ? template.id : null, title, content });
    };

    return (
        <ModalOverlay>
            <ModalContent>
                <h2>{template ? '템플릿 수정' : '새 템플릿 추가'}</h2>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="템플릿 제목"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="템플릿 내용"
                />
                <ButtonGroup>
                    <Button onClick={handleSave}>저장</Button>
                    <Button onClick={onClose}>취소</Button>
                </ButtonGroup>
            </ModalContent>
        </ModalOverlay>
    );
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
`;

const Header = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
`;

const TemplateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(2, auto);
    gap: 18px;
    overflow-y: auto;
    justify-content: center;
    max-width: 2250px; // (440px * 5) + (15px * 4) = 2250px
    margin: 0 auto;
`;

const TemplateCard = styled.div`
    width: 350px;
    height: 300px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: #f9f9f9;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 25px;
    box-sizing: border-box;
`;

const CardTitle = styled.h3`
    font-size: 16px;
    color: ${theme.colors.text};
`;

const MessageArea = styled.textarea`
    width: 100%;
    height: 150px;
    border: none;
    resize: none;
    font-size: 14px;
    background-color: #ffffff;
    padding: 10px;
    margin-bottom: 15px;
    border-radius: 5px;
    box-sizing: border-box;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
`;

const Button = styled.button`
    padding: 10px 20px;
    background-color: ${theme.colors.buttonPrimary.background};
    color: ${theme.colors.buttonPrimary.text};
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;

    &:hover {
        background-color: ${theme.colors.buttonPrimary.hover};
    }
`;

const EditButton = styled(Button)`
    flex: 1;
    background-color: #007AFF;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background-color: #0056b3;
    }
`;

const DeleteButton = styled(Button)`
    flex: 1;
    background-color: #ffffff;
    color: #1c1c1e;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #ddd;

    &:hover {
        background-color: #f0f0f0;
    }
`;

const PaginationButtons = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 20px;
`;

const PaginationButton = styled.button`
    background-color: ${props => props.active ? theme.colors.buttonPrimary.background : 'white'};
    color: ${props => props.active ? theme.colors.buttonPrimary.text : theme.colors.buttonSecondary.text};
    border: 1px solid ${theme.colors.buttonSecondary.border};
    padding: 5px 10px;
    margin: 0 5px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background-color: ${theme.colors.buttonSecondary.hover};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

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
`;

const ModalContent = styled.div`
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    width: 80%;
    max-width: 500px;

    h2 {
        margin-top: 0;
    }

    input, textarea {
        width: 100%;
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }

    textarea {
        height: 150px;
    }
`;

export default MessageTemplates;
