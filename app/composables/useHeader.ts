export const useHeader = () => {
  const showHeaderBack = useState('showHeaderBack', () => false);
  // 记录上次播放动画的绝对时间戳
  const lastPlayedTime = useState('lastPlayedTime', () => 0);

  return { showHeaderBack, lastPlayedTime };
};
