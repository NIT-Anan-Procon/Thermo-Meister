//データシート登録
function datasheetregistration(){
  var target = getLastRows(dataID,1)+1;
  dataID.getRange(target,1).setValue(settingrng.offset(3,1).getValue());
  dataID.getRange(target,2).setValue(settingrng.offset(3,3).getValue());
  makedropdown(dataID,settingrng,9,1);
  makedropdown(dataID,originrng,3,1);
  /*
  var ssNew = SpreadsheetApp.create("タイトル台帳");
  Browser.msgBox(ssNew.getUrl());
  */
}

//モジュール登録
function moduleregistration(){
  var targetmodule = getLastRows(moduledata,1)+1;
  moduledata.getRange(targetmodule,1).setValue(settingrng.offset(9,4).getValue());
  moduledata.getRange(targetmodule,2).setValue(settingrng.offset(9,6).getValue());
  moduledata.getRange(targetmodule,3).setValue(settingrng.offset(9,7).getValue())
  makedropdown(moduledata,originrng,7,1);
  initdatapage();
}

//圃場登録
function filedregistration(){ 
  var fielddata = setting.getRange(16,2,1,5).getValues();
  var col = 14;
  var row = getLastRows(ventilationpage,col)+4;
  ventilationpage.getRange(row,col,1,5).setValues(fielddata);
  initventilationdata();
}

//換気率登録ページに新規生成
function initventilationdata(){
  var ventcol = ventilationdata.getLastColumn()+2;
  var fieldname = setting.getRange(16,2).getValue();
  var titles = [[fieldname,""],["換気日","換気率"]];
  ventilationdata.getRange(1,ventcol,2,2).setValues(titles);
}

//データページ生成
function initdatapage(){
  for (var i=0; i<datapage.length; i++){
    var lastcol,titles;
    var date = Moment.moment([2018, originrng.offset(16, 2).getValue()-1, originrng.offset(16, 3).getValue(), 00, 00, 00]);
    if(i==0){
      lastcol = datapage[i].getLastColumn()+1;
      titles = [[settingrng.offset(9,4).getValue(),"","","",""],["date", "max", "min", "ave","naro_TMP_mea"]];
    }else{
      lastcol = datapage[i].getLastColumn()+2;
      titles = [[settingrng.offset(9,4).getValue(),""],["date","value"],[date.add(1, "day").format(),""]];
    }
    datapage[i].getRange(1,lastcol,titles.length,titles[0].length).setValues(titles);
  }
}

//変更を戻す
function undodatapage(){
  var targetmodule = getLastRows(moduledata,1);
  moduledata.getRange(targetmodule,1,1,3).clear();
  for (var i=0; i<datapage.length; i++){
    var lastcol = datapage[i].getLastColumn();
    var range = datapage[i].getRange(1,1);
    if(i==0)datapage[i].getRange(1, lastcol-4, 2, 5).clear();
    else datapage[i].getRange(1, lastcol-2, 2, 3).clear();
  }
}