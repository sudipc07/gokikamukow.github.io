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

                var board_id = null;
                jira_call(jira_url + "/rest/agile/1.0/board", function(msg) {
                    for (var i = 0; i < msg.values.length; i++) {
                        if (msg.values[i].name === board_name) {
                            jira.board = msg.values[i];
                            break;
                        }
                    }
                    jira.issues = [];
                    var n = 0;

                    function get_next(startAt, total, on_update) {
                        jira_call(jira_url + "/rest/agile/1.0/board/" + jira.board.id + "/backlog?jql=issuetype!%3DSub-task&startAt=" + startAt + "&maxResults=100&fields=summary,customfield_10262,epic,fixVersions", function(msg) {
                            jira.issues = jira.issues.concat(msg.issues);
                            total = msg.total;
                            startAt = msg.startAt + msg.issues.length;
                            on_update(jira);
                            if (startAt < total) {
                                get_next(startAt, total, on_update)
                            }
                        });
                    }
                    get_next(0, 0, on_update);
                });
            }
        });
    });
}
