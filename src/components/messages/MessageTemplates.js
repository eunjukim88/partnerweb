import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import EditModal from './EditModal';

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

    const handleDeleteTemplate = (id, title) => {
        if (window.confirm(`"${title}" 템플릿을 삭제하시겠습니까? 삭제된 템플릿은 다시 복구되지 않습니다.`)) {
            setTemplates(prev => prev.filter(template => template.id !== id));
        }
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
                            <DeleteButton onClick={() => handleDeleteTemplate(template.id, template.title)}>삭제</DeleteButton>
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

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
    width: 100%;
    max-width: 1800px;
    margin: 0 auto;
`;

const Header = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
`;

const TemplateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 18px;
    overflow-y: auto;
    padding: 10px;
    width: 100%;
    max-width: 1800px;
    margin: 0 auto;

    /* 최소 너비가 350px일 때 한 줄에 최대 5개까지만 표시 */
    @media (min-width: 1800px) {
        grid-template-columns: repeat(5, 1fr);
    }

    /* 화면이 작아질 때 자동으로 줄바꿈 */
    @media (max-width: 1500px) {
        grid-template-columns: repeat(4, 1fr);
    }

    @media (max-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const TemplateCard = styled.div`
    width: 100%;
    min-height: 300px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: #f9f9f9;
    display: flex;
    flex-direction: column;
    padding: 25px;
    box-sizing: border-box;
    margin: 0 auto;
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

export default MessageTemplates;
