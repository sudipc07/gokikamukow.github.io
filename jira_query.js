var jiraq = {

    preparedom : function (target_id) {
        ip = document.createElement('input');
        ip.text = 'Reload data from JIRA'
        document.getElementById(target_id).appendChild(ip)
    }

};



function jira_call(url, on_success) {
    AJS.$.ajax({
        url: url,
        type: "GET",
        async: true,
        dataType: "json"
    }).done(on_success).fail(function(jqXHR, textStatus) {
        data = {
            'textStatus': textStatus,
            'url': url
        };
        alert("Request failed: " + JSON.stringify(data, null, 4));
    });
}


function get_jira_info(board_name, on_update) {
    var jira = {};

    jira_call("https://confluence.dolby.net/kb/rest/jiraanywhere/1.0/servers", function(msg) {
        AJS.$.each(msg, function(key, val) {
            if (val.name && val.name.indexOf('Dolby Issue System') > -1) {
                var jira_url = "https://confluence.dolby.net/kb/plugins/servlet/applinks/proxy?appId=" + val.id + "&path=" + val.url;

                jira_call(jira_url + "/rest/agile/1.0/board", function(msg) {
                    for (var i = 0; i < msg.values.length; i++) {
                        if (msg.values[i].name === board_name) {
                            jira.board = msg.values[i];
                            break;
                        }
                    }
                    jira.issues = [];
                    var issues_results = [];

                    function get_next(startAt, maxResults, on_update) {
                        jira_call(jira_url + "/rest/agile/1.0/board/" + jira.board.id + "/backlog?jql=issuetype!%3DSub-task&startAt=" + startAt + "&maxResults=" + maxResults + "&fields=summary,customfield_10262,epic,fixVersions", function(msg) {
                            issues_results.push(msg);
                            issues_results.sort(function(a, b) {
                                return a.startAt - b.startAt
                            });
                            var issues = []
                            jira.issues = [];
                            for (var i = 0; i < issues_results.length; i++) {
                                issues = issues.concat(issues_results[i].issues);
                            }
                            jira.issues = issues;
                            if (issues.length == msg.total) {
                                console.log('Calling update function')
                                on_update(jira);
                            }
                            console.log(JSON.stringify([msg.startAt, msg.startAt + msg.issues.length, msg.total, issues.length]))
                            for (var i = 0; i < issues_results.length; i++) {
                                console.log(JSON.stringify([issues_results[i].startAt, issues_results[i].issues.length, issues_results[i].startAt + issues_results[i].issues.length]))
                            }
                        });
                    }

                    for (var i = 0; i < 1000; i+=100) {
                        get_next(i, i + 100, on_update);    
                    }
                });
            }
        });
    });
}
