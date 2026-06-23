/**
 * Invocable Apex action for an Agentforce Agent.
 *
 * Wraps the same "create follow-up Task on an Account" capability exposed by the
 * Python LangChain tool of the same name, so the SF-native Agent can perform the
 * exact same CRM action when invoked through Agentforce.
 *
 * Register this in Setup → Agents → <Your Agent> → Topics → New Action,
 * pointing at this Apex method.
 */
public with sharing class CreateFollowUpTaskAction {

    public class Request {
        @InvocableVariable(required=true label='Account Name or Id'
            description='Salesforce Account Id (15/18 char) or a name fragment to match')
        public String clientNameOrId;

        @InvocableVariable(required=true label='Subject'
            description='Short subject line for the follow-up task')
        public String subject;

        @InvocableVariable(label='Due Date (yyyy-MM-dd)'
            description='Optional ISO due date. Defaults to 7 days from today.')
        public String dueDate;

        @InvocableVariable(label='Description'
            description='Longer body / context for the task')
        public String description;

        @InvocableVariable(label='Priority'
            description='Low / Normal / High; defaults to Normal')
        public String priority;
    }

    public class Response {
        @InvocableVariable public Id taskId;
        @InvocableVariable public Id accountId;
        @InvocableVariable public String status;
        @InvocableVariable public String message;
    }

    @InvocableMethod(label='Create Follow-Up Task on Client Account'
        description='Creates a Task on the matched Account and returns the new Task Id.')
    public static List<Response> run(List<Request> reqs) {
        List<Response> out = new List<Response>();
        for (Request r : reqs) {
            Response res = new Response();
            try {
                Id accountId = resolveAccount(r.clientNameOrId);
                if (accountId == null) {
                    res.status = 'NOT_FOUND';
                    res.message = 'No Account matched ' + r.clientNameOrId;
                    out.add(res);
                    continue;
                }
                Date due = parseDate(r.dueDate);
                String priority = String.isBlank(r.priority) ? 'Normal' : r.priority;
                Task t = new Task(
                    WhatId = accountId,
                    Subject = r.subject,
                    Description = r.description,
                    ActivityDate = due,
                    Status = 'Not Started',
                    Priority = priority
                );
                insert t;
                res.taskId = t.Id;
                res.accountId = accountId;
                res.status = 'CREATED';
                res.message = 'Task created for ' + r.subject;
            } catch (Exception e) {
                res.status = 'ERROR';
                res.message = e.getMessage();
            }
            out.add(res);
        }
        return out;
    }

    private static Id resolveAccount(String nameOrId) {
        if (String.isBlank(nameOrId)) return null;
        String trimmed = nameOrId.trim();
        if (trimmed.length() == 15 || trimmed.length() == 18) {
            try {
                Id candidate = Id.valueOf(trimmed);
                if (candidate.getSobjectType() == Account.SObjectType) return candidate;
            } catch (Exception ignored) {}
        }
        String like = '%' + String.escapeSingleQuotes(trimmed) + '%';
        List<Account> hits = [SELECT Id FROM Account WHERE Name LIKE :like LIMIT 1];
        return hits.isEmpty() ? null : hits[0].Id;
    }

    private static Date parseDate(String raw) {
        if (String.isBlank(raw)) return Date.today().addDays(7);
        try { return Date.valueOf(raw); }
        catch (Exception ignored) { return Date.today().addDays(7); }
    }
}
