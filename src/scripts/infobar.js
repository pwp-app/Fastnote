var infobar_container;

$(function(){
    infobar_container = $("#electron-titlebar");
});

var infobar_id = 0;
var infobar_timeout = {};

//显示Infobar
function displayInfobar(type, text, timeout = 3000, dismiss = true) {
    var html = "";
    switch (type) {
        case 'success':
            html += '<div class="infobar infobar-success" id="infobar_' + infobar_id + '"><i class="fa fa-check infobar-icon"></i><span>';
            html += text;
            html += '</span>';
            if (dismiss){
                html += '<i class="fa fa-times infobar-dismiss" onclick="closeInfobar('+infobar_id+');"></i>';
            }
            html += '</div>';
            break;
        case 'warning':
            html += '<div class="infobar infobar-warning" id="infobar_' + infobar_id + '"><i class="fa fa-warning infobar-icon"></i><span>';
            html += text;
            html += '</span>';
            if (dismiss){
                html += '<i class="fa fa-times infobar-dismiss" onclick="closeInfobar('+infobar_id+');"></i>';
            }
            html += '</div>';
            break;
        case 'error':
            html += '<div class="infobar infobar-error" id="infobar_' + infobar_id + '"><i class="fa fa-warning infobar-icon"></i><span>';
            html += text;
            html += '</span>';
            if (dismiss){
                html += '<i class="fa fa-times infobar-dismiss" onclick="closeInfobar('+infobar_id+');"></i>';
            }
            html += '</div>';
            break;
        case 'update':
            timeout = 0; //禁用自动关闭
            html += '<div class="infobar infobar-info" id="infobar_update"><i class="fa fa-spinner icon-spin infobar-icon"></i><span id="infobar-update-text">' + text + '</span><progress class="update-progress" id="update-progress" value="0" max="100"></progress>';
            html += '</div>';
            break;
        case 'info':
        default:
            html += '<div class="infobar infobar-info" id="infobar_' + infobar_id + '"><i class="fa fa-info-circle infobar-icon"></i><span>';
            html += text;
            html += '</span>';
            if (dismiss){
                html += '<i class="fa fa-times infobar-dismiss" onclick="closeInfobar('+infobar_id+');"></i>';
            }
            html += '</div>';
            break;
    }
    infobar_container.append($(html));
    //animate
    //timeout > 0则自动关闭，否则需要用户手动关闭
    if (timeout > 0) {
        //用t中转
        var t = infobar_id;
        $('#infobar_' + t).animateCss('fadeInDown faster', function () {
            infobar_timeout.infobar_id = setTimeout(function () {
                $('#infobar_' + t).animateCss('fadeOutUp faster', function () {
                    $('#infobar_' + t).remove();
                });
            }, timeout);
        });
    } else {
        $('#infobar_' + infobar_id).animateCss('fadeInDown faster');
    }
    //更新infobar
    if (type=="update"){
        $('#infobar_update').animateCss('fadeInDown faster');
    }
    infobar_id++;
}

displayInfobar.success = (text, timeout = 3000, dismiss = true) => {
    displayInfobar('success', text, timeout, dismiss);
};
displayInfobar.warn = (text, timeout = 3000, dismiss = true) => {
    displayInfobar('warn', text, timeout, dismiss);
};
displayInfobar.error = (text, timeout = 3000, dismiss = true) => {
    displayInfobar('error', text, timeout, dismiss);
};
displayInfobar.info = (text, timeout = 3000, dismiss = true) => {
    displayInfobar('info', text, timeout, dismiss);
};

var Infobar = displayInfobar;

function closeInfobar(id){
    clearTimeout(infobar_timeout.id);
    $('#infobar_' + id).animateCss('fadeOutUp faster', function () {
        $('#infobar_' + id).remove();
    });
}

function clearInfoBarContainer() {
    infobar_container.innerHTML = '';
}