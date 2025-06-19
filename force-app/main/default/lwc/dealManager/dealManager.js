import { LightningElement, wire, track } from 'lwc';
import getDeals from '@salesforce/apex/DealController.getDeals';
import createBankRequest from '@salesforce/apex/DealController.createBankRequest';
import updateDealStage from '@salesforce/apex/DealController.updateDealStage';
import updateCaseStatus from '@salesforce/apex/DealController.updateCaseStatus';

const COLUMNS = [
    { label: 'Deal Name', fieldName: 'name', type: 'text' },
    { label: 'Phone', fieldName: 'contactPhone', type: 'phone' },
    { label: 'Email', fieldName: 'contactEmail', type: 'email' },
    { label: 'Owner', fieldName: 'ownerName', type: 'text' },
    { label: 'Created', fieldName: 'createdDate', type: 'date' },
    { label: 'Stage', fieldName: 'stage', type: 'text', cellAttributes: { class: { fieldName: 'stageClass' } } },
    {
        type: 'action',
        typeAttributes: { rowActions: [
            { label: 'New Bank Request', name: 'new_request' },
            { label: 'View Requests', name: 'view_requests' },
            { label: 'Change Stage', name: 'change_stage' }
        ]}
    }
];

const CASE_COLUMNS = [
    { label: 'Subject', fieldName: 'Subject', type: 'text' },
    { label: 'Status', fieldName: 'Status', type: 'text' },
    { label: 'Created', fieldName: 'CreatedDate', type: 'date' },
    {
        type: 'action',
        typeAttributes: { rowActions: [ { label: 'Update Status', name: 'update_status' } ] }
    }
];

export default class DealManager extends LightningElement {
    @track deals = [];
    @track stageFilter = '';
    @track showRequestModal = false;
    @track showCaseModal = false;
    @track showStageModal = false;
    @track showStatusModal = false;
    @track selectedDeal = {};
    selectedCaseId;

    newStage;
    newStatus;

    bank;
    ccUsers;
    subject;
    body;

    columns = COLUMNS;
    caseColumns = CASE_COLUMNS;

    stageOptions = [
        { label: 'All', value: '' },
        { label: 'Prospecting', value: 'Prospecting' },
        { label: 'Qualification', value: 'Qualification' },
        { label: 'Closed Won', value: 'Closed Won' },
        { label: 'Closed Lost', value: 'Closed Lost' }
    ];

    statusOptions = [
        { label: 'New', value: 'New' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Closed', value: 'Closed' }
    ];

    @wire(getDeals, { stageFilter: '$stageFilter' })
    wiredDeals({ error, data }) {
        if (data) {
            this.deals = data.map(d => {
                return { ...d, stageClass: 'stage-' + d.stage.replace(/\s/g, '') };
            });
        } else if (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    handleStageFilter(event) {
        this.stageFilter = event.detail.value;
    }

    handleRowAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;
        this.selectedDeal = row;
        if (action === 'new_request') {
            this.bank = '';
            this.ccUsers = '';
            this.subject = row.name;
            this.body = '';
            this.showRequestModal = true;
        } else if (action === 'view_requests') {
            this.showCaseModal = true;
        } else if (action === 'change_stage') {
            this.newStage = row.stage;
            this.showStageModal = true;
        }
    }

    handleCaseAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;
        if (action === 'update_status') {
            this.selectedCaseId = row.Id;
            this.newStatus = row.Status;
            this.showStatusModal = true;
        }
    }

    handleBankChange(event) {
        this.bank = event.detail.value;
    }
    handleCcChange(event) {
        this.ccUsers = event.detail.value;
    }
    handleSubjectChange(event) {
        this.subject = event.detail.value;
    }
    handleBodyChange(event) {
        this.body = event.detail.value;
    }

    closeRequestModal() {
        this.showRequestModal = false;
        this.bank = '';
        this.ccUsers = '';
        this.subject = '';
        this.body = '';
    }
    closeCaseModal() {
        this.showCaseModal = false;
        this.selectedCaseId = null;
    }
    closeStageModal() {
        this.showStageModal = false;
        this.newStage = null;
    }
    closeStatusModal() {
        this.showStatusModal = false;
        this.newStatus = null;
    }

    handleStageChange(event) {
        this.newStage = event.detail.value;
    }
    handleStatusChange(event) {
        this.newStatus = event.detail.value;
    }

    saveStage() {
        updateDealStage({ opportunityId: this.selectedDeal.opportunityId, newStage: this.newStage })
            .then(() => {
                this.showStageModal = false;
                this.stageFilter = this.stageFilter;
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error(error);
            });
    }

    saveStatus() {
        updateCaseStatus({ caseId: this.selectedCaseId, newStatus: this.newStatus })
            .then(() => {
                this.showStatusModal = false;
                this.stageFilter = this.stageFilter;
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error(error);
            });
    }

    sendRequest() {
        const ccIds = this.ccUsers ? this.ccUsers.split(',').map(x => x.trim()) : [];
        createBankRequest({ opportunityId: this.selectedDeal.opportunityId, bankAccountId: this.bank, ccUserIds: ccIds, subject: this.subject, body: this.body })
            .then(() => {
                this.showRequestModal = false;
                this.stageFilter = this.stageFilter;
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error(error);
            });
    }
}
