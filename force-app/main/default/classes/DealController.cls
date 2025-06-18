public with sharing class DealController {
    @AuraEnabled(cacheable=true)
    public static List<DealWrapper> getDeals(String stageFilter) {
        String stage = String.isBlank(stageFilter) ? null : stageFilter;
        List<Opportunity> opps = [
            SELECT Id, Name, StageName, CreatedDate, Owner.Name,
                   Primary_Contact__r.Phone, Primary_Contact__r.Email
            FROM Opportunity
            WHERE (:stage == null OR StageName = :stage)
            ORDER BY CreatedDate DESC
            LIMIT 200
        ];
        Map<Id, List<Case>> oppCases = new Map<Id, List<Case>>();
        for (Case c : [SELECT Id, Subject, Status, AccountId, CreatedDate, Opportunity__c
                        FROM Case
                        WHERE Opportunity__c IN :opps]) {
            if (!oppCases.containsKey(c.Opportunity__c)) {
                oppCases.put(c.Opportunity__c, new List<Case>());
            }
            oppCases.get(c.Opportunity__c).add(c);
        }
        List<DealWrapper> wrappers = new List<DealWrapper>();
        for (Opportunity o : opps) {
            DealWrapper w = new DealWrapper();
            w.opportunityId = o.Id;
            w.name = o.Name;
            w.stage = o.StageName;
            w.createdDate = o.CreatedDate;
            w.ownerName = o.Owner.Name;
            w.contactPhone = o.Primary_Contact__r != null ? o.Primary_Contact__r.Phone : null;
            w.contactEmail = o.Primary_Contact__r != null ? o.Primary_Contact__r.Email : null;
            w.cases = oppCases.containsKey(o.Id) ? oppCases.get(o.Id) : new List<Case>();
            wrappers.add(w);
        }
        return wrappers;
    }

    @AuraEnabled
    public static Id createBankRequest(Id opportunityId, Id bankAccountId, List<Id> ccUserIds,
                                       String subject, String body) {
        Case c = new Case();
        c.Opportunity__c = opportunityId;
        c.AccountId = bankAccountId;
        c.Subject = subject;
        c.Description = body;
        insert c;
        if (ccUserIds != null) {
            List<Task> tasks = new List<Task>();
            for (Id uid : ccUserIds) {
                Task t = new Task(WhatId=c.Id, OwnerId=uid, Subject='Bank Request CC');
                tasks.add(t);
            }
            if (!tasks.isEmpty()) insert tasks;
        }
        return c.Id;
    }

    @AuraEnabled
    public static void updateDealStage(Id opportunityId, String newStage) {
        Opportunity opp = [SELECT Id, StageName FROM Opportunity WHERE Id=:opportunityId LIMIT 1];
        opp.StageName = newStage;
        update opp;
    }

    @AuraEnabled
    public static void updateCaseStatus(Id caseId, String newStatus) {
        Case c = [SELECT Id, Status FROM Case WHERE Id=:caseId LIMIT 1];
        c.Status = newStatus;
        update c;
    }

    public class DealWrapper {
        @AuraEnabled public Id opportunityId;
        @AuraEnabled public String name;
        @AuraEnabled public String stage;
        @AuraEnabled public DateTime createdDate;
        @AuraEnabled public String ownerName;
        @AuraEnabled public String contactPhone;
        @AuraEnabled public String contactEmail;
        @AuraEnabled public List<Case> cases;
    }
}
