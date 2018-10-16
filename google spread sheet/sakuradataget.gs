//Sakura.io データ取得
function SakuraDataGet_oneday(module,rowdata,channel){   
  //データシートのレンジを取得
  var range=rowdata.getRange(1, 1);
  
  //メインページの日付欄から日付変数を生成
  var after =  Moment.moment([2018, originrng.offset(16, 2).getValue()-1, originrng.offset(16, 3).getValue(), 15, 00, 00]);
  var before = Moment.moment([2018, originrng.offset(16, 6).getValue()-1, originrng.offset(16, 7).getValue(), 15, 00, 00]);
  
  //温度チャンネルの場合詳細温度ページを使用するので準備
  if(channel==temperature_channel) var calctargetcol=checktargetcol(module,datapage[0],5);
  
  //日付の差を取得
  after.add(-1, "day");
  var diff = before.diff(after, 'days');
  
  try{ //データをSakura.ioから取得
    for(var i = 0;i<diff; i++){
      getdropdownmoduledata(module);
      url+="&after="+after.format().slice(0,19);
      after.add(1, 'days');
      url+="&before="+after.format().slice(0,19)+"&size=200"+"&channel="+channel;
      var jsonData = JSON.parse(UrlFetchApp.fetch(url).getContentText());
      var jsonlength=jsonData.results.length-1;
      if(channel==temperature_channel)Calculation_temperature(range,jsonData,jsonlength,rowlastlow,calctargetcol);
      else sakuradatawrite(range,jsonData,jsonlength,rowlastlow);
      getNaroData(module);
      rowlastlow=getLastRows(rowdata,rowtargetcol+1);
      url = "https://api.sakura.io/datastore/v1/channels?";
    }
    return 0;
  }catch (e) { //失敗した場合更新時の日付になるまでリトライ
    url = "https://api.sakura.io/datastore/v1/channels?";
    if(!after.isSame(Moment.moment(),'day')){
      after.add(1, 'days');
      originrng.offset(16, 2).setValue(after.format().slice(5,7));
      originrng.offset(16, 3).setValue(after.format().slice(8,10));
      SakuraDataGet_oneday(module,rowdata,channel);
    }else{
      return 1;
    }
  }
}

//最高、最低、平均気温計算 温度データ記録
function Calculation_temperature(range,jsonData,jsonlength,lastlow,calctargetcol) {
  var calclastlow=getLastRows(datapage[0],calctargetcol+1);
  var date, max_temp=jsonData.results[0].value, min_temp=jsonData.results[0].value, ave_temp=0;
  
  for(j=1; jsonlength>=0; jsonlength--,j++) {
    date = Moment.moment(jsonData.results[jsonlength].datetime.slice(0,19)+"Z").zone("+09:00");
    if(range.offset(lastlow+j, rowtargetcol).isBlank()){
      range.offset(lastlow+j, rowtargetcol).setValue(date.format().slice(5,10)+" "+date.format().slice(11,16));
      range.offset(lastlow+j, rowtargetcol+1).setValue(jsonData.results[jsonlength].value);
    }
    if(max_temp<jsonData.results[jsonlength].value)max_temp=jsonData.results[jsonlength].value;   
    if(min_temp>jsonData.results[jsonlength].value)min_temp=jsonData.results[jsonlength].value;    
    ave_temp+=jsonData.results[jsonlength].value;
  }
  var lastcalcdata = Moment.moment(calculation_range.offset(calclastlow-1, calctargetcol).getValue()).zone("+09:00");
  if(lastcalcdata.isSame(date, 'day'))calclastlow--;
  
  calculation_range.offset(calclastlow, calctargetcol,1,4).setValues([[date.format().slice(5,10),
                                                                       max_temp,
                                                                       min_temp,
                                                                       ave_temp/jsonData.results.length]]);
}

//農研機構から平均気温を取得
function getNaroData(module){
  //var module = originrng.offset(7,1).getValue();
  var narotargetcol = checktargetcol(module,datapage[0],5)+5;
  var narolastrow = getLastRows(datapage[0],narotargetcol)+1;
  var daylastrow = getLastRows(datapage[0],narotargetcol-4);
  for(j=narolastrow;j<=daylastrow;j++){
    if(datapage[0].getRange(j,narotargetcol).isBlank() || narolastrow == daylastrow){
      var m = Moment.moment(datapage[0].getRange(j, narotargetcol-4).getValue());
      var data =  load_csv(makeurl(m,["TMP_mea"],0));
      for(var ii=0;ii<data.length;ii++)data[ii].shift();
      data.splice(0, 2);
      data.pop();
      datapage[0].getRange(j,narotargetcol,data.length,1).setValues(data);
    }
  }
}

//湿度、日射量、電池電圧のデータを記録
function sakuradatawrite(range,jsonData,jsonlength,lastrow){
  var date;
  for(j=0; jsonlength>=0; jsonlength--,j++) {
    if(range.offset(lastrow+j, rowtargetcol).isBlank()){
      date = Moment.moment(jsonData.results[jsonlength].datetime.slice(0,19)+"Z").zone("+09:00"); 
      range.offset(lastrow+j, rowtargetcol).setValue(date.format().slice(5,10)+" "+date.format().slice(11,16));
      range.offset(lastrow+j, rowtargetcol+1).setValue(jsonData.results[jsonlength].value);
    }
  }
}
