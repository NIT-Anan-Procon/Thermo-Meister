//���C���ǂݍ��݃g���K�[
function load(){
  ventilationrng.offset(11,8).setValue( loadventilationdata(ventilationrng.offset(5,8).getValue()) );
}

//���C���̓ǂݍ���
function loadventilationdata(target) {
  var col = checktargetcol(target, ventilationdata, 3)+1;
  var row = getLastRows(ventilationdata,col)
  return ventilationdata.getRange(row,col+1).getValue();
}

//���C�����Z�[�u����
function saveventilationdata() {
  var ventilationval = ventilationrng.offset(11,8).getValue();
  var today = Moment.moment().zone("+09:00");
  var col = checktargetcol(ventilationrng.offset(5,8).getValue(), ventilationdata, 3)+1;
  var row = getLastRows(ventilationdata,col)+1;
  var range = ventilationdata.getRange(row,col,1,2);
  range.setValues([[today.format('YYYY-MM-DD'),ventilationval]]);
}

//����������
function inserthole(){
  const folder_id = "1-otEZC4mYPSdocaxlpSgv0gMhbnSW7_T"; //�摜�t�@�C��������t�H���_��ID
  const image_name = "03.png"; //�}������摜�t�@�C����
  var fol = DriveApp.getFolderById(folder_id);
  var image = fol.getFilesByName(image_name).next(); //���O����t�@�C���擾
  ventilationpage.insertImage(image.getBlob(),3,8); //�t�@�C������Blob�擾���摜�Ƃ��đ}��
}