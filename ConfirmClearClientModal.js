import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { replace } from 'redux-router';

import { commonMessages, withTranslation } from 'reach-utils/intl';
import { getReferralsByStatuses } from 'reach-dux/selectors/activeCase';
import { clearActiveClient, setActiveCase } from 'reach-dux/actions/activeCase';

import Button from 'reach-ui/atoms/Button';
import Modal, { ModalTitle, ModalBody } from 'reach-ui/elements/Modal';

const messages = defineMessages({
	confirmStartOver: {
		id: 'ConfirmClearClientModal:confirmStartOver',
		defaultMessage: 'You have {savedCount} services saved. Would you like to attach them to a patient record before starting over?',
		description: 'Modal title with info on number of saved services for a client'
	}
});

class ConfirmClearClientModal extends Component {
	static propTypes = {
		savedCount: PropTypes.number,
		clearActiveClient: PropTypes.func,
		hideDialog: PropTypes.func,
		replace: PropTypes.func,
		_t: PropTypes.func
	}

	saveClient = () => {
		const { hideDialog, replace } = this.props;
		hideDialog();
		replace('/resource/newPatient?clearClientOnSave=true');
	}

	hide = () => {
		const { clearActiveClient, hideDialog, replace } = this.props;
		clearActiveClient();
		hideDialog();
		replace('/resource/newPatient');
	}

	render() {
		const {
			hideDialog,
			savedCount,
			_t
		} = this.props;

		return (
			<Modal short
					wide
					contentLabel="ConfirmClearClientModal"
					onRequestClose={hideDialog}
					className="ConfirmClearClientModal">
				<ModalTitle className="ConfirmClearClientModal__title">
					{_t(messages.confirmStartOver, {savedCount})}
				</ModalTitle>
				<ModalBody align='center'>
					<Button onClick={this.saveClient} type="primary">{_t(commonMessages.yes)}</Button>
					<Button onClick={this.hide} type="link">{_t(commonMessages.noThankYou)}</Button>
				</ModalBody>
			</Modal>
		);
	}
}

function mapStateToProps(state) {
	return {
		savedCount: getReferralsByStatuses(state)(['Open', 'Successful']).size
	};
}
export default compose(
	withTranslation,
	connect(mapStateToProps, {
		clearActiveClient,
		replace,
		setActiveCase
	})
)(ConfirmClearClientModal);