import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReservationList from '../../components/reservations/ReservationList';
import { FaList, FaCalendarAlt } from 'react-icons/fa';

const ReservationsPage = () => {
  const [viewMode, setViewMode] = useState('list');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/reservations');
        if (!response.ok) {
          throw new Error('Failed to fetch reservations');
        }
        const data = await response.json();
        setReservations(data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  return (
    <PageContent>
      <ControlContainer>
        <ViewModeButtons>
          {['list', 'timeline'].map(mode => (
            <ViewModeButton key={mode} active={viewMode === mode} onClick={() => setViewMode(mode)}>
              {mode === 'list' ? <FaList /> : <FaCalendarAlt />}
            </ViewModeButton>
          ))}
        </ViewModeButtons>
      </ControlContainer>
      {loading ? (
        <LoadingMessage>예약 정보를 불러오는 중...</LoadingMessage>
      ) : viewMode === 'list' ? (
        <ReservationList reservations={reservations} />
      ) : (
        <ReservationTimeline reservations={reservations} />
      )}
    </PageContent>
  );
};

const PageContent = styled.div`
  padding: 15px;
`;

const ControlContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
`;

const ViewModeButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewModeButton = styled.button`
  background-color: ${props => props.active ? '#535353' : '#f0f0f0'};
  color: ${props => props.active ? '#ffffff' : '#535353'};
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
`;

export default ReservationsPage;