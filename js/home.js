const $ = require("jquery");

const SPACE_NAME = "<work-space-name>";
const LOG_DIRECTORY_PATH = path.join(__dirname, "slacklog/" + SPACE_NAME);
const USERS_JSON_PATH = LOG_DIRECTORY_PATH + "/users.json";
const CHANNELS_JSON_PATH = LOG_DIRECTORY_PATH + "/channels.json";

let allUserList = [];
let selectedChannelID = "";
let allChannelList = [];

let printedChannelMessages = [];

window.onload = function() {
  //   console.log("hello");
  //   console.log(USERS_JSON);
  $("#space-name").text(SPACE_NAME);
  fs.readFile(USERS_JSON_PATH, (err, file) => {
    var data = JSON.parse(file);
    structureUserList(data);
    //console.log(allUserList);
    fs.readFile(CHANNELS_JSON_PATH, (err, file) => {
      var data = JSON.parse(file);
      //console.log(data);
      allChannelList = data;
      let channelName = setChannels(data);
      //console.log(channelName);
      getThreadLog(channelName);
    });
  });
};

$("#test-button").click(function() {
  console.log("#cli");
});

function structureUserList(userList) {
  userList.forEach(user => {
    let id = user.id;
    allUserList[id] = user;
  });
}

function setChannels(channelList) {
  let channelHtml = "";
  let firstName = "";
  channelList.forEach((channel, index) => {
    let name = channel.name;
    let id = channel.id;
    allChannelList[id] = channel;
    if (firstName == "") firstName = name;

    let selected = "";
    if (index == 0) {
      selected = "channel-selected";
      selectedChannelID = id;
    }

    let html =
      "<p id=" +
      id +
      " onclick=onClickChannel(this)" +
      " class=" +
      selected +
      " ># " +
      name +
      "</p>";
    channelHtml += html;
  });
  channelHtml += "<p>チャンネルを追加する</p>";
  $("#channel-tab-content").append(channelHtml);
  return firstName;
}

function onClickChannel(e) {
  let selectID = e.id;
  $("#" + selectedChannelID).removeClass("channel-selected");
  $("#" + selectID).addClass("channel-selected");
  selectedChannelID = selectID;
  let selectChannelName = allChannelList[selectID].name;
  getThreadLog(selectChannelName);
}

function setThreadLog(threadLogList) {
  // htmlへセット
  $(".thread-tab")
    .children()
    .remove();
  let threadLogDateKeys = Object.keys(threadLogList);
  //$(".thread-tab").append("<div class=tab-header><p>チャンネル名</p></div>");
  threadLogDateKeys.forEach(indexDate => {
    $(".thread-tab").append("<div><hr><p>" + indexDate + "</p></div>");
    let threadLog = threadLogList[indexDate];
    let threadLogTimestampKeys = Object.keys(threadLog);
    threadLogTimestampKeys.forEach(threadTimestamp => {
      let thread = threadLog[threadTimestamp];
      let username = thread.username;
      let ts = thread.ts;
      let text = thread.text;
      let image = thread.image;
      let reactionHtml = "";
      if (isset(thread.reactions)) {
        reactionHtml += '<div class="reaction-stamps">';
        let threadReactions = thread.reactions;
        threadReactions.forEach(reaction => {
          reactionHtml +=
            '<div class="stamp">' +
            reaction.name +
            " " +
            reaction.count +
            "</div>";
        });
        reactionHtml += "</div>";
      }
      let replyHtml = "";
      if (isset(thread.reply)) {
        let reply = thread.reply;
        replyHtml +=
          '<div class="reply-thread" onclick="onClickThread(this)" id=' +
          reply.thread_ts +
          "><img src =" +
          reply.reply_icon +
          ' class="reply-user-icon">' +
          '<span class="reply-count-text">' +
          reply.reply_count +
          "件の返信</span>" +
          '<span class="reply-date-text">' +
          reply.reply_last_date +
          "日前</span>" +
          "<span class=reply-date-text>スレッドを表示する</span></div>";
      }
      let appendHtml =
        "<div class=message-area><img src=" +
        image +
        ' class="user-icon"><div class="information-area"><div class="name-and-time-header"><div class="user-name">' +
        username +
        '</div><div class="time">' +
        ts +
        "</div></div>" +
        '<div class="message-text">' +
        text +
        "</div>" +
        reactionHtml +
        replyHtml +
        "</div></div>";
      $(".thread-tab").append(appendHtml);
      let height = document.getElementById("thread-tab");
      height.scrollTop = height.scrollHeight;
      //$(".thread-tab").scrollTop = height;
    });
  });
  // //$(".thread-tab").scrollIntoView(false);
  // let element = document.getElementById("thread-tab");
  // element.scrollIntoView(false);
}

function getThreadLog(channelName) {
  $("#channel-name").text("# " + channelName);
  fs.readdir(LOG_DIRECTORY_PATH + "/" + channelName, function(err, files) {
    if (err) throw err;
    var fileList = files.filter(function(file) {
      return true; //TODO 絞り込み
    });
    //console.log(fileList);
    let threadLogList = formatThreadLog(fileList, channelName);
    // fileList.forEach(fileName => {
    //   let fileDate = fileName.replace(".json", "");
    //   var file = fs.readFileSync(
    //     LOG_DIRECTORY_PATH + "/" + channelName + "/" + fileName
    //   );
    //   var dataList = JSON.parse(file);
    //   threadLogList[fileDate] = formatThreadLog(dataList);
    // });
    // console.log(threadLogList);
    printedChannelMessages = threadLogList;
    setThreadLog(threadLogList);
  });
}

function formatThreadLog(fileList, channelName) {
  let threadLogList = [];
  fileList.forEach(fileName => {
    let fileDate = fileName.replace(".json", "");
    var file = fs.readFileSync(
      LOG_DIRECTORY_PATH + "/" + channelName + "/" + fileName
    );
    var threadList = JSON.parse(file);
    //threadLogList[fileDate] = formatThreadLog(dataList);

    let minThreadLog = [];
    threadList.forEach(thread => {
      let minThread = [];
      let threadTimestamp = "";
      //必須 username $ icon
      if (isset(thread.user)) {
        // ユーザー
        let targetUser = allUserList[thread.user];
        let profile = targetUser.profile;
        minThread["username"] = profile.real_name;
        minThread["image"] = profile.image_192;
      } else if (isset(thread.username)) {
        // botなど
        minThread["username"] = thread.username;
        minThread["image"] = "./images/human.svg";
      } else {
        // オリジナルbot その他
        minThread["username"] = "不明";
        minThread["image"] = "./images/human.svg";
      }

      // 必須 text
      if (isset(thread.text)) {
        minThread["text"] = threadTextConverter(thread.text);
      } else {
        minThread["text"] = "";
      }

      // 必須ts
      if (isset(thread.ts)) {
        threadTimestamp = thread.ts;
        let threadDate = new Date(threadTimestamp * 1000);
        minThread["ts"] =
          ("00" + threadDate.getHours()).slice(-2) +
          ":" +
          ("00" + threadDate.getMinutes()).slice(-2);
      } else {
        // tsがないのであればスルーさせる
        return;
      }

      // reactions
      if (isset(thread.reactions)) {
        let minReactions = [];
        let reactions = thread.reactions;

        reactions.forEach((reaction, index) => {
          let minReaction = [];
          minReaction["name"] = reaction.name;
          minReaction["count"] = reaction.count;
          minReactions[index] = minReaction;
        });
        minThread["reactions"] = minReactions;
      }

      // isThread
      if (isset(thread.thread_ts)) {
        let orgThreadTs = thread.ts;
        let threadTs = thread.thread_ts;
        let threadDate = new Date(threadTs * 1000);
        let orgDate = new Date(orgThreadTs * 1000);
        let seachDate =
          ("0000" + threadDate.getFullYear()).slice(-4) +
          "-" +
          ("00" + (threadDate.getMonth() + 1)).slice(-2) +
          "-" +
          ("00" + threadDate.getDate()).slice(-2);
        let nowDate = new Date();
        let diffDate = (nowDate - orgDate) / 86400000;
        if (
          isset(threadLogList[seachDate]) &&
          isset(threadLogList[seachDate][threadTs])
        ) {
          let searchThread = threadLogList[seachDate][threadTs];
          let replyCount =
            isset(searchThread.reply) && isset(searchThread.reply.reply_count)
              ? searchThread.reply.reply_count
              : 0;
          searchThread["reply"] = {
            thread_ts: threadTs,
            reply_count: replyCount + 1,
            reply_last_date: Math.floor(diffDate),
            reply_icon: thread.user_profile.image_72
          };
          let tmp = [];
          if (isset(searchThread["reply_threads"])) {
            tmp = searchThread["reply_threads"];
          }
          tmp[orgThreadTs] = minThread;
          searchThread["reply_threads"] = tmp;
          // スレッドはリターンする
          threadLogList[seachDate][threadTs] = searchThread;
          return;
        }
      }

      minThreadLog[threadTimestamp] = minThread;
    });
    if (Object.keys(minThreadLog).length !== 0) {
      threadLogList[fileDate] = minThreadLog;
    }
  });
  return threadLogList;
}

function threadTextConverter(text) {
  // userメンションの置換
  let userIDList = text.match(/\<@.+>/g);
  if (userIDList) {
    userIDList.forEach(user => {
      let mensionUser = user.replace("<@", "").replace(">", "");
      if (isset(allUserList[mensionUser])) {
        // userが存在するのでメンションに置換する
        let targetUser = allUserList[mensionUser];
        let targetUserProfile = targetUser.profile;
        text = text.replace(
          user,
          "<span class=personal-mention>@" +
            targetUserProfile.display_name +
            "</span>"
        );
      }
    });
  }

  // 全体メンションの置換
  text = text
    .replace("<!here>", "<span class=general-mention>@here</span>")
    .replace("<!channel>", "<span class=general-mention>@channel</span>");

  // 改行の置換
  text = text.replace("\n", "<br>");
  return text;
}

function onClickThread(e) {
  let ts = e.id;
  let threadDate = new Date(ts * 1000);
  let parentDateText =
    ("0000" + threadDate.getFullYear()).slice(-4) +
    "-" +
    ("00" + (threadDate.getMonth() + 1)).slice(-2) +
    "-" +
    ("00" + threadDate.getDate()).slice(-2);
  // console.log(parentDateText);
  // console.log(printedChannelMessages[parentDateText][ts]);

  let targetThread = printedChannelMessages[parentDateText][ts];
  setThreadHtml(targetThread);
  $(".reply-tab").show();
  $(".tab-header-thread").show();
}

function setThreadHtml(thread) {
  let html = getThreadHtml(thread);
  html += "<hr><div>" + thread.reply.reply_count + "件の返信</div>";
  let replys = thread.reply_threads;
  // console.log(replys);
  let dateKeys = Object.keys(replys);
  dateKeys.forEach(date => {
    let reply = replys[date];
    // console.log(reply);
    html += getThreadHtml(reply);
  });
  $("#reply-tab")
    .children()
    .remove();
  $("#reply-tab").append(html);
}

function getThreadHtml(thread) {
  let username = thread.username;
  let ts = thread.ts;
  let text = thread.text;
  let image = thread.image;
  let reactionHtml = "";
  if (isset(thread.reactions)) {
    reactionHtml += '<div class="reaction-stamps">';
    let threadReactions = thread.reactions;
    threadReactions.forEach(reaction => {
      reactionHtml +=
        '<div class="stamp">' + reaction.name + " " + reaction.count + "</div>";
    });
    reactionHtml += "</div>";
  }
  let replyHtml = "";
  let appendHtml =
    "<div class=message-area><img src=" +
    image +
    ' class="user-icon"><div class="information-area"><div class="name-and-time-header"><div class="user-name">' +
    username +
    '</div><div class="time">' +
    ts +
    "</div></div>" +
    '<div class="message-text">' +
    text +
    "</div>" +
    reactionHtml +
    replyHtml +
    "</div></div>";
  return appendHtml;
}

function onClickCloseThread() {
  $(".reply-tab").hide();
  $(".tab-header-thread").hide();
}

/**
 * isset
 * @param {*} value
 */
function isset(value) {
  if (typeof value != "undefined") {
    return true;
  } else {
    return false;
  }
}
