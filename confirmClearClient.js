import { registerDialog, showDialog, hideDialog } from 'reach-dialogs';
import ConfirmClearClientModal from '../components/ConfirmClearClientModal'

// Register the dialog so that's it's available
const dialogKey = registerDialog(ConfirmClearClientModal);

export const onConfirmClearClient = () => {
	return (dispatch) => {
		return new Promise((resolve) => {
			() => {
				dispatch(hideDialog());
				resolve();
			}

			// Show dialog immediately for feedback
			dispatch(showDialog(dialogKey));

		});
	};
};