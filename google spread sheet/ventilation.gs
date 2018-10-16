//換気率読み込みトリガー
function load(){
  ventilationrng.offset(11,8).setValue( loadventilationdata(ventilationrng.offset(5,8).getValue()) );
}

//換気率の読み込み
function loadventilationdata(target) {
  var col = checktargetcol(target, ventilationdata, 3)+1;
  var row = getLastRows(ventilationdata,col)
  return ventilationdata.getRange(row,col+1).getValue();
}

//換気率をセーブする
function saveventilationdata() {
  var ventilationval = ventilationrng.offset(11,8).getValue();
  var today = Moment.moment().zone("+09:00");
  var col = checktargetcol(ventilationrng.offset(5,8).getValue(), ventilationdata, 3)+1;
  var row = getLastRows(ventilationdata,col)+1;
  var range = ventilationdata.getRange(row,col,1,2);
  range.setValues([[today.format('YYYY-MM-DD'),ventilationval]]);
}

//穴あけ部分
function inserthole(){
  const folder_id = "1-otEZC4mYPSdocaxlpSgv0gMhbnSW7_T"; //画像ファイルがあるフォルダのID
  const image_name = "03.png"; //挿入する画像ファイル名
  var fol = DriveApp.getFolderById(folder_id);
  var image = fol.getFilesByName(image_name).next(); //名前からファイル取得
  ventilationpage.insertImage(image.getBlob(),3,8); //ファイルからBlob取得→画像として挿入
}