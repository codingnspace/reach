export const activateClient = (reachId) => {
	return (dispatch, getState) => {
		dispatch(setActiveClient(reachId));
		return dispatch(getClientDetails(reachId, { include_referrals: true, forceRefresh: true }))
		.then((client) => {
			const state = getState();
			const activeCase = getActiveCase(state);

			// If client has a zipcode, then update the app to register and validate it
			if (client.primary_zipcode) {
				dispatch(geocode(client.primary_zipcode));
			}
			const enrollmentsAtDesk = (client.enrollments || []).filter(
				isEnrollmentAtDesk(activeDeskIdSelector(state))
			);
			const mobileEnrollment = enrollmentsAtDesk.find(isEnrollmentMobile);
			const caseMangEnrollment = enrollmentsAtDesk.find(isEnrollmentOpen);
			const hasLocalCaseWithReferrals = isActiveCaseLocal(state) && activeCase.get('referrals').size > 0;

			// If client has a pre-existing mobile or case management case,
			// set that case as the active case, else create a new case.
			if (mobileEnrollment) {
				dispatch(setActiveCase(mobileEnrollment.id));
				if (hasLocalCaseWithReferrals) {
					dispatch(mergeLocalCase(activeCase));
					dispatch(removeLookup({enrollments: ['local_case']}));
				}
			} else if (caseMangEnrollment) {
				dispatch(setActiveCase(caseMangEnrollment.id));
				if (hasLocalCaseWithReferrals) {
					dispatch(mergeLocalCase(activeCase));
					dispatch(removeLookup({enrollments: ['local_case']}));
				}
			} else {
				dispatch(createEnrollment());
			}
		})
	}
}