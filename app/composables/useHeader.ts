export const useHeader = () => {
	const showHeaderBack = useState('showHeaderBack', () => false);
	return { showHeaderBack };
};
