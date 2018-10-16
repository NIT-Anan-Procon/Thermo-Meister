//グローバル変数
var mainspreadsheet = SpreadsheetApp.getActiveSpreadsheet();

var mainpage = mainspreadsheet.getSheetByName("メインページ");
var detailpage = mainspreadsheet.getSheetByName("詳細グラフページ");
var ventilationpage = mainspreadsheet.getSheetByName("換気率記録ページ");
var simulationpage = mainspreadsheet.getSheetByName("換気率判断支援ページ");
var setting = mainspreadsheet.getSheetByName("設定");
var dataID = mainspreadsheet.getSheetByName("データシートID");
var ventilationdata = mainspreadsheet.getSheetByName("換気率データ");
var view = mainspreadsheet.getSheetByName("ビューシート");
var moduledata = mainspreadsheet.getSheetByName("モジュール");

var originrng = mainpage.getRange(1,1);
var detailrng = detailpage.getRange(1,1);
var ventilationrng = ventilationpage.getRange(1,1);
var simulationrng = simulationpage.getRange(1,1);
var settingrng = setting.getRange(1,1);
var datarng = dataID.getRange(1,1);
var ventilationdatarng = ventilationdata.getRange(1,1);
var viewrng = view.getRange(1,1);

var dataspreadsheet = openspreadsheet();

var datapage = [dataspreadsheet.getSheetByName("最高・最低・平均温度"),
                dataspreadsheet.getSheetByName("温度"),
                dataspreadsheet.getSheetByName("湿度"),
                dataspreadsheet.getSheetByName("日射量"),
                dataspreadsheet.getSheetByName("電池電圧")];
  
var stringchannel=["温度-日-",
                   "温度-詳細-",
                   "湿度",
                   "日射量",
                   "電池電圧"];

var calculation_range=datapage[0].getRange(1,1);

var graphYposition = 1;
var graphXposition = 15;
var title;

var rowtargetcol;
var rowlastlow;

//Sakura.io JSONのURLデータ
var url = "https://api.sakura.io/datastore/v1/channels?";
var temperature_channel="1";
var humidity_channel="2";
var radiation_channel="7";
var eneloop_channel="15";

var channel=[0,
             temperature_channel,
             humidity_channel,
             radiation_channel,
             eneloop_channel];
//