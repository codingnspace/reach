import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { debounce, get } from 'lodash';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { defineMessages } from 'react-intl';
import { withRouter } from 'react-router';
import { compose, withState } from 'recompose';
import Paginator from 'react-js-pagination';

import { withTranslation, commonMessages } from 'reach-utils/intl';
import { scrollToTop } from 'reach-utils/browser';

// ACTIONS
import { listAndStoreClients } from 'reach-datatypes/clients/actions';
import { getClientHLId } from 'reach-datatypes/clients/manipulation';
import { clearActiveClient, setActiveClient, setActiveCase } from 'reach-dux/actions/activeCase';
import { activateClient } from '../actions';
import { onConfirmClearClient } from '../actions/confirmClearClient';
import { replaceQueryParam } from 'reach-utils/routing';

// SELECTORS
import { getActiveClient, getActiveCase, isActiveCaseLocal } from 'reach-dux/selectors/activeCase';
import { activeDeskSelector } from 'reach-dux/selectors/login';

// Internal Imports
import { storeClients, lookupClients } from 'reach-lookup/types/clients';

// COMPONENTS
import Button from 'reach-ui/atoms/Button';
import ClientCardList from '../components/ClientCardList';
import Divider from 'reach-ui/atoms/Divider';
import HeaderBorder from 'reach-ui/elements/HeaderBorder';
import IntlDocTitle from 'reach-ui/containers/IntlDocTitle';
import Link from 'reach-ui/atoms/Link';
import LoadingPlaceholder from 'reach-ui/containers/LoadingPlaceholder';
import NoItemsFound from 'reach-ui/elements/NoItemsFound';
import SearchBox from 'reach-ui/elements/SearchBox';

import './FindPatient.less';

const messages = defineMessages({
	enterNewPatient: {
		id: 'FindPatient:enterNewPatient',
		defaultMessage: 'Enter a New Patient',
		description: 'button text to navigate to the New Patient screen'
	},
	findPatient: {
		id: 'FindPatient:findPatient',
		defaultMessage: 'Find Patient',
		description: 'Tab title for Find Patient page'
	},
	noneFound: {
		id: 'FindPatient:noneFound',
		defaultMessage: "Your search didn't return any patients.",
		description: 'No clients found with query'
	},
	searchBy: {
		id: 'FindPatient:searchBy',
		defaultMessage: 'search by patient name, MRN, etc...',
		description: 'Placeholder text in the search for patient text box'
	}
});

const PAGE_SIZE = 10;
class FindPatient extends Component {
	static propTypes = {
		activeCase: PropTypes.instanceOf(Immutable.Map),
		activeClient: PropTypes.instanceOf(Immutable.Map),
		activePage: PropTypes.number,
		caseIsLocal: PropTypes.bool,
		clientRecords: PropTypes.instanceOf(Immutable.Map),
		foundClients: PropTypes.array,
		hospitalId: PropTypes.string,
		location: PropTypes.object,
		router: PropTypes.object,
		activateClient: PropTypes.func,
		clearActiveClient: PropTypes.func,
		listAndStoreClients: PropTypes.func,
		onConfirmClearClient: PropTypes.func,
		replaceQueryParam: PropTypes.func,
		setActivePage: PropTypes.func,
		setFoundClients: PropTypes.func,
		_t: PropTypes.func
	}

	componentWillMount() {
		this.findPatient = debounce(this.findPatient, 250);
		const urlQuery = get(this.props, ['location', 'query', 'q']);
		if (urlQuery) {
			this.findPatient({ search: urlQuery });
		}
	}

	findPatient = (formData) => {
		const {
			foundClients = [],
			hospitalId,
			listAndStoreClients,
			setActivePage,
			setFoundClients
		} = this.props;
		if (get(formData, 'search') && formData.search.length >= 3) {
			setFoundClients([]);
			return listAndStoreClients({
				query: formData.search,
				hospital_id: hospitalId
			}, {
				onPageLoaded: (clientIdsOnPage) => {
					setFoundClients(foundClients.concat(clientIdsOnPage));
				}
			})
			.then((allClientIds) => {
				this.props.replaceQueryParam({q: formData.search})
				setFoundClients(allClientIds);
				setActivePage(1);
			});
		}
	}

	activateClientOnCardClick = (client = {}) => {
		const { activateClient } = this.props;
		const reachId = getClientHLId(client);

		reachId && activateClient(reachId)
		.then(() => {
			this.props.router.replace('/resource/saved-services');
		});
	}

	newPatient = () => {
		const { activeCase, activeClient, caseIsLocal, clearActiveClient, onConfirmClearClient, router } = this.props;
		// When there is an activeCase but no activeClient, confirm that user wants to clear work
		if (caseIsLocal && activeCase.get('referrals').size > 0) {
			onConfirmClearClient();
		} else if (activeCase.get('referrals').size > 0 || activeClient) {
			clearActiveClient();
			router.push('/resource/newPatient');
		} else {
			router.push('/resource/newPatient');
		}
	}

	setActivePageAndScrollToTop = (pageNum) => {
		this.props.setActivePage(pageNum);
		scrollToTop()
	}


	render() {
		const { activePage, clientRecords, foundClients, location, setActivePage, _t } = this.props;

		const pageStart = PAGE_SIZE * (activePage - 1);
		const pageEnd = Math.min(PAGE_SIZE * activePage, clientRecords.size);
		const clientList = clientRecords.toArray().slice(pageStart, pageEnd)
		return (
			<IntlDocTitle titleMessage={_t(messages.findPatient)}>
				<div className="FindPatient">
					<HeaderBorder text={_t(messages.findPatient)} />
					<div className="FindPatient__skipLink">
						<Link to="/resource/selectNeed">{_t(commonMessages.skipStep)}</Link>
					</div>
					<div className="FindPatient__resultBox u-center">
						<SearchBox
								initialValue={get(location, ['query', 'q'])}
								onChange={this.findPatient}
								form="searchClients"
								autoFocus
								placeholder={_t(messages.searchBy)} />
						<LoadingPlaceholder apis={['listClients']} checkUnopened={false}>
							{clientRecords.size ? (
								<div>
									{clientRecords.size > PAGE_SIZE && (
										<Paginator
											activePage={activePage}
											itemsCountPerPage={PAGE_SIZE}
											totalItemsCount={clientRecords.size}
											prevPageText="Prev"
											nextPageText="Next"
											onChange={setActivePage} />
									)}
									{!!clientRecords.size && (
										<div className="FindPatient__resultCount">
											{clientRecords.size > PAGE_SIZE && `${pageStart + 1} - ${pageEnd} of `}
											{_t(commonMessages.clientsFound, {numberOfClients: clientRecords.size})}
										</div>
									)}
									<ClientCardList clients={clientList}
										activateClient={this.activateClientOnCardClick} />
									{clientRecords.size > PAGE_SIZE && (
										<Paginator
											activePage={activePage}
											itemsCountPerPage={PAGE_SIZE}
											totalItemsCount={clientRecords.size}
											prevPageText="Prev"
											nextPageText="Next"
											onChange={this.setActivePageAndScrollToTop} />
									)}
								</div>
							) : foundClients instanceof Array && (
								<NoItemsFound>
									{_t(messages.noneFound)}
								</NoItemsFound>
							)}
						</LoadingPlaceholder>
						<Divider>{_t(commonMessages.or)}</Divider>
						<Button onClick={this.newPatient}
								type="primary">
							{_t(messages.enterNewPatient)}
						</Button>
					</div>
				</div>
			</IntlDocTitle>
		);
	}
}

function mapStateToProps(state, ownProps) {
	return {
		activeCase: getActiveCase(state),
		activeClient: getActiveClient(state),
		caseIsLocal: isActiveCaseLocal(state),
		clientRecords: lookupClients(state)(ownProps.foundClients),
		hospitalId: activeDeskSelector(state).get('hospital_id')
	}
}

export default compose(
	withRouter,
	withTranslation,
	withState('foundClients', 'setFoundClients'),
	withState('activePage', 'setActivePage', 1),
	connect(mapStateToProps, {
		activateClient,
		clearActiveClient,
		listAndStoreClients,
		onConfirmClearClient,
		replaceQueryParam,
		setActiveCase,
		setActiveClient,
		storeClients
	})
)(FindPatient);
