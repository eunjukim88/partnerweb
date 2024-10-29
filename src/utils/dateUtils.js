export const formatTimeToAmPm = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);
    const period = hour >= 12 ? '오후' : '오전';
    
    if (hour > 12) {
      hour -= 12;
    } else if (hour === 0) {
      hour = 12;
    }
    
    return `${period}:${hour.toString().padStart(2, '0')}:${minutes}`;
  };
  
  export const formatTime = (timeStr) => {
    const [period, time] = timeStr.split(':');
    let [hours] = time.split(':');
    hours = parseInt(hours);
    
    if (period === '오후' && hours !== 12) {
      hours += 12;
    } else if (period === '오전' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:00:00`;
  };