import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PhoneContainer from '../messages/PhoneContainer';
import theme from '../../styles/theme';

const TEMPLATES_PER_PAGE = 8; // 한 페이지당 템플릿 수를 8개로 줄임

const MessageTemplates = () => {
    const [templates, setTemplates] = useState([
        { id: 1, title: "체크인 안내", content: "안녕하세요. 예약하신 객실은 [객실번호]입니다. 체크인 시간은 [체크인시간]입니다." },
        { id: 2, title: "체크아웃 안내", content: "체크아웃 시간은 [체크아웃시간]입니다. 이용해 주셔서 감사합니다." },
        { id: 3, title: "객실 청소 완료", content: "객실 청소가 완료되었습니다. 편안한 휴식 되세요." },
        { id: 4, title: "주변 관광지 안내", content: "주변 관광지 안내: [관광지명]이 [거리]km 거리에 있습니다." },
        { id: 5, title: "아침 식사 안내", content: "아침 식사는 [시간]부터 [장소]에서 제공됩니다." },
        { id: 6, title: "와이파이 안내", content: "와이파이 비밀번호 [비밀번호]입니다." },
        { id: 7, title: "미니바 이용 안내", content: "객실 내 미니바 이용 안내: [미니바 정보]" },
        { id: 8, title: "부대시설 이용 안내", content: "호텔 내 부대시설 이용 시간: [시설명] - [이용시간]" },
        { id: 9, title: "주차 안내", content: "주차 안내: [주차장 위치], 주차권은 프론트에서 받아가세요." },
        { id: 10, title: "늦은 체크아웃 안내", content: "늦은 체크아웃을 원하시면 프론트로 문의해 주세요." },
        { id: 11, title: "룸서비스 안내", content: "룸서비스는 24시간 이용 가능합니다. 내선 번호 [번호]로 연락해 주세요." },
        { id: 12, title: "수영장 이용 안내", content: "수영장 이용 시간은 [시작시간]부터 [종료시간]까지입니다. 즐거운 시간 보내세요." },
        { id: 13, title: "피트니스 센터 안내", content: "피트니스 센터는 [위치]에 있으며, 24시간 이용 가능합니다." },
        { id: 14, title: "스파 예약 안내", content: "스파 예약은 내선 [번호]로 연락 주시기 바랍니다." },
        { id: 15, title: "레스토랑 예약 안내", content: "[레스토랑명] 예약이 [시간]에 확정되었습니다. 즐거운 식사 되요." },
        { id: 16, title: "객실 업그레이드 안내", content: "고객님의 객실이 [새로운 객실타입]으로 무료 업그레이드되었습니다." },
        { id: 17, title: "긴급 상황 안내", content: "비상시 대피로는 객실 문 뒤에 부착되어 있습니다. 비상연락처: [번호]" },
        { id: 18, title: "환전 서비스 안내", content: "환전 서비스는 프론트 데스크에서 이용 가능합니다. 영업시간: [시작시간]-[종료시간]" },
        { id: 19, title: "세탁 서비스 안내", content: "세탁 서비스 이용을 원하시면 내선 [번호]로 연락해 주세요." },
        { id: 20, title: "체크아웃 연장 안내", content: "체크아웃 시간이 [새로운 시간]으로 연장되었습니다. 추가 요금은 [금액]입니다." }
    ]);

    const [selectedTemplates, setSelectedTemplates] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentTemplates, setCurrentTemplates] = useState([]);

    useEffect(() => {
        const indexOfLastTemplate = currentPage * TEMPLATES_PER_PAGE;
        const indexOfFirstTemplate = indexOfLastTemplate - TEMPLATES_PER_PAGE;
        setCurrentTemplates(templates.slice(indexOfFirstTemplate, indexOfLastTemplate));
    }, [currentPage, templates]);

    const handleSelectTemplate = (id) => {
        setSelectedTemplates(prev => 
            prev.includes(id) ? prev.filter(templateId => templateId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = () => {
        setTemplates(prev => prev.filter(template => !selectedTemplates.includes(template.id)));
        setSelectedTemplates([]);
    };

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
            <TemplateGridWrapper>
                <TemplateGrid>
                    {currentTemplates.map(template => (
                        <TemplateItem key={template.id}>
                            <StyledPhoneContainer title={template.title}>
                                <PhoneContent>
                                    <MessageArea readOnly value={template.content} />
                                    <ButtonGroup>
                                        <EditButton onClick={() => handleEditTemplate(template)}>수정</EditButton>
                                        <DeleteButton onClick={() => handleDeleteTemplate(template.id)}>삭제</DeleteButton>
                                    </ButtonGroup>
                                </PhoneContent>
                            </StyledPhoneContainer>
                        </TemplateItem>
                    ))}
                </TemplateGrid>
            </TemplateGridWrapper>
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
                <h2>{template ? '템플릿 수정' : '신규 템플릿 등록'}</h2>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="템플릿 제목"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
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
    height: calc(100vh - 60px);
    padding: 10px;
    box-sizing: border-box;
`;

const Header = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: 10px;
`;

const TemplateGridWrapper = styled.div`
    flex: 1;
    overflow: hidden;
`;

const TemplateGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    height: 100%;
    overflow-y: auto;
    padding-right: 5px;
`;

const TemplateItem = styled.div`
    height: 250px;
    border: 1px solid ${theme.colors.border};
    border-radius: 8px;
    overflow: hidden;
    background-color: #f9f9f9;
`;

const StyledPhoneContainer = styled(PhoneContainer)`
    height: 100%;
    display: flex;
    flex-direction: column;
    .phone-title {
        text-align: center;
        font-size: 14px;
        padding: 8px 0;
        font-weight: bold;
        background-color: #f0f0f0;
    }
`;

const PhoneContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 8px;
    overflow: hidden;
`;

const MessageArea = styled.textarea`
    flex: 1;
    width: 100%;
    border: none;
    resize: none;
    font-size: 12px;
    background-color: #ffffff;
    padding: 5px;
    margin-bottom: 8px;
    overflow-y: auto;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 5px;
`;

const Button = styled.button`
    padding: 6px 12px;
    background-color: ${theme.colors.buttonPrimary.background};
    color: ${theme.colors.buttonPrimary.text};
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 12px;

    &:hover {
        background-color: ${theme.colors.buttonPrimary.hover};
    }
`;

const EditButton = styled(Button)`
    flex: 1;
`;

const DeleteButton = styled(Button)`
    flex: 1;
    background-color: ${theme.colors.buttonSecondary.background};
    &:hover {
        background-color: ${theme.colors.buttonSecondary.hover};
    }
`;

const PaginationButtons = styled.div`
    display: flex;
    justify-content: center;
    padding: 10px 0 0;
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

    input, textarea {
        width: 100%;
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
`;

export default MessageTemplates;
