//�O���[�o���ϐ�
var mainspreadsheet = SpreadsheetApp.getActiveSpreadsheet();

var mainpage = mainspreadsheet.getSheetByName("���C���y�[�W");
var detailpage = mainspreadsheet.getSheetByName("�ڍ׃O���t�y�[�W");
var ventilationpage = mainspreadsheet.getSheetByName("���C���L�^�y�[�W");
var simulationpage = mainspreadsheet.getSheetByName("���C�����f�x���y�[�W");
var setting = mainspreadsheet.getSheetByName("�ݒ�");
var dataID = mainspreadsheet.getSheetByName("�f�[�^�V�[�gID");
var ventilationdata = mainspreadsheet.getSheetByName("���C���f�[�^");
var view = mainspreadsheet.getSheetByName("�r���[�V�[�g");
var moduledata = mainspreadsheet.getSheetByName("���W���[��");

var originrng = mainpage.getRange(1,1);
var detailrng = detailpage.getRange(1,1);
var ventilationrng = ventilationpage.getRange(1,1);
var simulationrng = simulationpage.getRange(1,1);
var settingrng = setting.getRange(1,1);
var datarng = dataID.getRange(1,1);
var ventilationdatarng = ventilationdata.getRange(1,1);
var viewrng = view.getRange(1,1);

var dataspreadsheet = openspreadsheet();

var datapage = [dataspreadsheet.getSheetByName("�ō��E�Œ�E���ω��x"),
                dataspreadsheet.getSheetByName("���x"),
                dataspreadsheet.getSheetByName("���x"),
                dataspreadsheet.getSheetByName("���˗�"),
                dataspreadsheet.getSheetByName("�d�r�d��")];
  
var stringchannel=["���x-��-",
                   "���x-�ڍ�-",
                   "���x",
                   "���˗�",
                   "�d�r�d��"];

var calculation_range=datapage[0].getRange(1,1);

var graphYposition = 1;
var graphXposition = 15;
var title;

var rowtargetcol;
var rowlastlow;

//Sakura.io JSON��URL�f�[�^
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