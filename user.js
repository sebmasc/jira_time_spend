// ==UserScript==
// @name         JIRA Time Spend
// @namespace    https://jira.unity.pl/
// @version      1.1
// @description  show timeSpend for all user for issue API: https://docs.atlassian.com/jira/REST/cloud/#api/2/. You have to change your domain jira
// @author       sebmasc
// @match        https://jira.unity.pl/browse/*
// @grant        PUBLIC
// @updateURL	 https://raw.githubusercontent.com/sebmasc/jira_time_spend/master/user.js
// @downloadURL	 https://raw.githubusercontent.com/sebmasc/jira_time_spend/master/user.js
// ==/UserScript==

(function() {
    'use strict';

    var $ = jQuery;
	start();

    function start(){
        var path = location.pathname;

        $.ajax({
            url: 'https://jira.unity.pl/rest/api/2/issue/'+path.substring(path.lastIndexOf('browse/')+7) + '/worklog',
            success: function(json){
                $('#git-issue-webpanel').after(getWorkLogs(json.worklogs));
            }
        });
    }

    function getWorkLogs(ws){
        var el, k, logs = {}, logs2 = [];
        var html = $('<div class="module toggle-wrap"><div class="mod-header"><h2 class="toggle-title">Time Spend</h2></div><div class="mod-content item-details"></div></div>');
        
        for(k in ws){
            el = ws[k];
            var log = logs[el.author.key] || {};
            var logStart = new Date(log.timeStart || new Date()),
                logEnd = log.timeEnd || 0;
            var comm = (log.comments || []);comm.unshift('['+ (el.timeSpentSeconds/60/60).toFixed(1) +' h] '+ el.comment);
            
            logs[el.author.key] = {
                author: el.author.key,
                timeSpend: (log.timeSpend || 0) + el.timeSpentSeconds,
                comments: comm,
                timeStart: logStart < new Date(el.started) ? logStart : new Date(el.started),
                timeEnd: new Date(logEnd) > new Date(el.started) ? new Date(logEnd) : new Date(el.started)
            };
        }
        for(k in logs){
            el = logs[k];
            logs2.push({
                author: k,
                timeSpendHour: el.timeSpend/60/60,
                // set 1 if timeEnd === timeStart
                timeLogDay: ((el.timeEnd - el.timeStart)/1000/60/60/24) || 1
            });
        }
        logs2.sort(sortMethod);
        for(var i=0;i<logs2.length;i++){
            el = logs2[i];
            var baseLog = logs[el.author];
            html.find('.mod-content').append('<dl><dt title="'+ getComments(baseLog.comments) +'">'+ (i+1) +'. '+ el.author + ': </dt><dd>' + el.timeSpendHour.toFixed(2) +' h <span style="margin-left: 20px;color: #bbb;" title="Days from first to las log time &#013; '+ baseLog.timeStart.toLocaleDateString() + ' - ' + baseLog.timeEnd.toLocaleDateString() +'">('+ el.timeLogDay.toFixed(0) +' days)</span></dd></dl>');
        }
    
        return html;
    }
    
    function getComments(list){
        var html = 'Komentarzy: '+ list.length +'&#013;';
        for(i=0;i<list.length;i++){
            html += list.length-i +'. ' + list[i].replace(/(\s)*$/, '') + '&#013;';
        }
        return html;
    }
        
    function sortMethod(a,b) {
        if (a.timeSpendHour > b.timeSpendHour)
            return -1;
        if (a.timeSpendHour < b.timeSpendHour)
            return 1;
        return 0;
    }
})();
