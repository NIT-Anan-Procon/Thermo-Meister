/*SensorSleepV2_Sakura.ino   Eneloop BT_FAN WDT 2.08*/
#define VernNo "Ver2.08"

//制御フラグ
byte Cont_flg = 0b00000011; //Initialization
#define Initialization   0b00000001  //1:Initialization
#define fanON       0b00000100  //1:fanON   
#define NoRTC       0b01000000  //1:RTCが無い
#define SDLog       0b10000000  //1:SDLog出力  

//WDTタイムアウト
#include <avr/wdt.h>
volatile byte wdt_cycle = 0;           // WDTタイムアウトカウント
volatile byte INT_flag = 0;           // 1 RTC割り込み，0 WDT割り込み
volatile byte INT_count = 0;           // 割込カウント(フリーズ対応)
#define timeout_count5 36              //5分 WDTソフトリセット時間設定
//外部割込み
#include <avr/io.h>             
#include <avr/interrupt.h>      // 割り込み

// ピンチェンジ割り込み0 ハンドラ //記述しない場合割り込み発生後にリセットボタン押下状態に陥る
ISR(PCINT0_vect)
{
  INT_flag=1;   // RTC割り込み判断フラグをセット
  INT_count++;   // 割り込みカウントをインクリメント
  if (INT_count >= 60) { //INT 2分ｘ60（2時間）経過したらソフトリセット
     software_Reset();
  }
}

//SleepMode
#include <avr/sleep.h>
#ifndef cbi
#define cbi(sfr, bit) (_SFR_BYTE(sfr) &= ~_BV(bit))
#endif
#ifndef sbi
#define sbi(sfr, bit) (_SFR_BYTE(sfr) |= _BV(bit))
#endif

//Arduinoライブラリ
#include <Wire.h>
#include <SPI.h>

//さくらのIoT
#include <SakuraIO.h>

/*SHT21 I2Cアドレス指定*/
#define SHT2x 0b1000000
#define CMD_TEMP 0b11100011
#define CMD_RH 0b11100101

/*RTC I2Cアドレス指定*/
#define I2C_ADDR (0xA2 >> 1)
#define PIN_Wakeup 9                 //RTC割り込み用
#define BAUDRATE 9600   //ボーレート

#include <skRTClib.h>
#include <SD.h>

//for SD shield
#define chipSelect 8  //chipselect 端子番号
#define soil 6        //土壌湿度計用電源端子
#define TRON 10      //PVの8.2Ω短絡による電流測定ON
#define FanOn 7      //FANのBT駆動ON
#define Sakura 3     //さくらのIoT

int val[4];          //ad値の平均値
byte fanON_count=0;    //日射量に応じたFAN駆動時間調整用カウント
String Time_m;         //計測開始時の時刻を記録
unsigned long Time_n=0;  //RTCレス時の計測カウンタ

/*変数定義*/
float humidity = 0;                  //湿度を初期化
float temperature = 0;               //気温を初期化
byte RtcCount = 0;                    //RTC動作カウント用
float Eneloop=5.88;                   //Eneloop電池電圧 
#define Eneloop_const 0.0064453125      //Eneloop電池電圧AD値からの換算係数 
float Radiation = 0;                 //2Wパネル測定日射量
float Radiation_old = 0;             //1回前の2Wパネル測定日射量
byte Reg_flag=0;                     //レギュレータON/OFF制御フラグ
#define Radiation_constant 1.41     //2Wパネル日射量センサ定数 0602見直し1.45→1.41
float soilmoist = 0;             //土壌湿度
long counttm=0;                     //SDカード書き込み用カウンタ

//sakura_send data
SakuraIO_I2C sakuraio;
byte Cha[32];                   //送信ch用配列
float Data[32];                 //送信データ用配列
int Offtime[32];                //送信オフセット時刻用配列
int data_count=0;               //送信データ数
unsigned long connectDelay=0;   //LTEに接続する際の遅延時間
unsigned long sendDelay=0;      //データを送信する際の遅延時間

void setup()
{
  Serial.begin(BAUDRATE);
  pinMode(TRON,OUTPUT);           	//太陽電池の短絡用トランジスタ制御用ポートを出力に設定
  digitalWrite(TRON,LOW);			//太陽電池の短絡用トランジスタをOFF
  pinMode(FanOn, OUTPUT);          	//FanOn(デジタル7番ピン)を出力に設定
  digitalWrite(FanOn,HIGH);        	//FANのBT駆動停止
  pinMode(Sakura,INPUT);
//  pinMode(soil,OUTPUT);
//  digitalWrite(soil,HIGH);
  pinMode(10, OUTPUT);				//SDカード用端子を出力に設定
  // The chipSelect pin you use should also be set to output
  pinMode(chipSelect, OUTPUT);		//SDカード用端子を出力に設定
  pinMode(12,OUTPUT); 				//SDカード用信号用ピンを出力に設定
 
  /*SleepMode解除用*/
  // ピンチェンジ割り込みマスク D9
  PCMSK0 |= (1 << PCINT1);
  // ピンチェンジ割り込み1 許可
  PCICR |= (1 << PCIE0);
  
  /*RTC設定*/
  pinMode(PIN_Wakeup, INPUT);           //PIN_Wakeup(デジタル9番ピン)を入力ピンに設定,RTC割込用
  Wire.begin();
  delay(100);
  // Control 2 の設定
  Wire.beginTransmission(I2C_ADDR);
  Wire.write(0x01);
  Wire.write(0b00010001); // 02 bit4 TI/TP 動作モードを繰り返しに設定
  //    bit0 TIE   /INT端子へ出力
  Wire.endTransmission();
  // タイマーのカウント数を設定
  Wire.beginTransmission(I2C_ADDR);
  Wire.write(0x0F);
  Wire.write(0b00000101); // 0F カウンタの回数を指定 //000101(2進)＝5(10進)
  Wire.endTransmission();
  // タイマーを開始
  Wire.beginTransmission(I2C_ADDR);
  Wire.write(0x0E);
  Wire.write(0b10000011); // 0E bit7 TE   タイマー割り込み開始 1分に設定
  //    TD(1,0) = 1,0 = 1秒
  //    bit1 TD1  1周期の間隔を設定 TD(1,0) = 1,1 = 1 分
  //    bit0 TD0
  Wire.endTransmission();
  
  //Pin mode setup
  digitalWrite(PIN_Wakeup, HIGH);

  byte tm[7] ;
  if(RTC.rTime(tm)!=0) {   // RTCから時刻が読み出せ無かったら
    Cont_flg = Cont_flg | NoRTC;  //NoRTCフラグに1(RTCが無い)をセット
  } 

  WDT_setup8();                          // 8秒のWDT設定
  Serial.println("--- during startup WDT_setup---");

  val[1]=ReadSens_ch(1,4,50);      //Eneloop電圧AD1の5回平均値(個別ch, 読取回数, intarvalms) 
  Eneloop=val[1]*Eneloop_const;
  
  // 日射量を検知したらスタート
  val[3]=0;
  while(val[3]==0){
    Serial.println("--- wait solar power---");
    digitalWrite(TRON,HIGH);         //TR ON  2Wパネル日射量測定の為太陽電池出力短絡ON
    delay(50);
    val[3]=ReadSens_ch(3,1,50);      //2Wパネル日射量AD3の5回平均値(個別ch, 読取回数, intarvalms)
    digitalWrite(TRON,LOW);          //TR OFF  太陽電池出力短絡OFF
    if(val[3]>0) break;
    system_sleep();         //delayの代わりに8秒sleepを利用
    wdt_cycle=0;            //softreset防止の為カウンタを毎回初期化
  }
  Serial.println("---Start Loop---");
 
}

void loop()
{

  //SetTime_m   
  if((Cont_flg & NoRTC)==0) Time_m = GetTime(0);
  else Time_m=String(Time_n++);
  
  temperature = Temperature();  //1回目の温度測定
  Humidity();					//湿度測定
  digitalWrite(FanOn,HIGH);		//FANのBT駆動停止

  digitalWrite(TRON,HIGH);         //TR ON  2Wパネル日射量測定の為太陽電池出力短絡ON
  val[3]=ReadSens_ch(3,4,50);      //2Wパネル日射量AD3の5回平均値(個別ch, 読取回数, intarvalms)
  digitalWrite(TRON,LOW);          //TR OFF  太陽電池出力短絡OFF

  if(RtcCount%2==0 &&  Eneloop>4.8 ) { //10分毎に,時電池電圧4.8V以上
    digitalWrite(FanOn,LOW);   //10分毎の測定時に，FANのBT駆動ON
  }
  float Radiation_now=val[3]*Radiation_constant;  //日射量測定
  Eneloop=val[1]*Eneloop_const;        //電池電圧測定
  Radiation=(Radiation_now+  Radiation_old)/2.0;   //1回前の測定値と平均値をRadiation値とする
  Radiation_old=Radiation_now;              //1回前の測定値を更新

  if ((Radiation<100 && fanON_count>=2) && Eneloop>4.8){      //日射量が200以上になった後で、日射量が100未満の時
    Cont_flg = Cont_flg | fanON;  //fanONフラグに1をセット
    fanON_count--;      //日没時は-1  Radiation=1000の時　1000/100*2.2=22-2で20x2分で40分
    digitalWrite(FanOn,LOW);   //電池電圧が4.8V以上ならFANのBT駆動ON
  }else{
    Cont_flg = Cont_flg & ~fanON;  //fanONフラグに0をセット
    if (fanON_count < Radiation/100*2.2){      //日射量の1/100*2.2がfanON_countより大きかったら設定、日射量が落ちてからもFANを回すように設定
      fanON_count = int(Radiation/100*2.2);
    }
  } 
  if ( (Radiation <0.0 || Eneloop<4.8) && fanON_count>0)      fanON_count--;      //電池電圧が4.8V未満ならさらに-1  

  //soilmoist Gravity 土壌湿度測定
  soilmoist = 0.0;  //初期化
  if(val[2]<= 530 && val[2]> 390)  soilmoist= -0.07143*val[2]+127.857; // 90-100(%) : 530-390in water
  else if(val[2]<= 650 && val[2]>530)  soilmoist= -0.66667*val[2]+443.333;  // 10-90(%) 650-530: humid soil
  else if(val[2]<  790 && val[2]>650 )  soilmoist= -0.07143*val[2]+56.429;    // 0-10(%) 790-650 : dry 

  temperature = (temperature + Temperature())/2.0;     //ここで2回目の温度測定し平均
  if((Cont_flg & fanON)==0) {          	//fanON flag=0（fan制御有り）なら測定後にFANのBT駆動停止
    digitalWrite(FanOn,HIGH);  			//FANのBT駆動OFF
  }

  if (RtcCount==0) {                                      //RtcCount==0なら送信タイミングのためオフセットなし
    //送信データを蓄積（ch,data,offtime）
    save_queue(1,temperature,0);
    save_queue(2,humidity,0);
    save_queue(7, Radiation,0);
    save_queue(15, Eneloop,0);
    if (soilmoist <0) soilmoist=0;  
    //save_queue(6, soilmoist,0);
  }else if (RtcCount%2==0) {                              //2回に1回（10分毎）にデータを蓄積
    int offset = (12-RtcCount)*300;                       //平常なら50～10分のオフセットを設定
    if(RtcCount>=12) offset = (24-RtcCount)*300;          //2時間送信時のオフセット設定
    
    save_queue(1, temperature, offset);
    save_queue(2, humidity   , offset);
    if (Radiation >=1.0) save_queue(7, Radiation, offset); //日射量が1.0以上ならアップ

/*  if (RtcCount%6==0) {                                  //30分毎にデータを蓄積
      if (soilmoist>0.0 ) save_queue(6, soilmoist, offset)
    }*/
  }
    
  if (RtcCount==0) {     //RtcCount==0なら送信試行開始
    if(Eneloop>4.6){     //電池電圧>4.6ならデータ送信開始
      Serial.println("sakura_ON");

      connectDelay=0;//遅延時間を初期化
      connectDelay = millis(); //接続を開始した時刻を保存する
      pinMode(Sakura,OUTPUT);
      digitalWrite(Sakura,HIGH); //Sakura.ioを起動
      boolean connectflag = connectLTE();//LTE接続を試行
      Serial.print("connectDelay=");
      Serial.println(connectDelay);
      
      if (connectflag==1) {      //1時間に1回、6回分のデータを送信
        for(int send_count=0; send_count<=data_count/17; send_count++){ //1回の送信で最大16個のデータを送信し、蓄積データが空になるまで続ける
          sakuraEnqueueTx();  //キューに保存データを送る
          sendDelay=0;
          sendDelay=millis(); //送信を開始した時刻を保存する
          sakuraio.send();    //データ送信開始
          uint8_t queue,immediate;
          for(;;){
            sakuraio.getTxStatus(&queue, &immediate); //getTxStatus(uint8_t *queue, uint8_t *immediate);
            if( queue==0 ) break;
            delay(100);
          }
          sendDelay = millis() - sendDelay; //送信にかかった時刻を計算
          if(sendDelay>=120000)sendDelay=0;//2分以上であれば無視する
          Serial.print("Send!:");
          Serial.println(sendDelay);
          connectDelay += sendDelay; //接続遅延時間に一回目の送信遅延時間を加算
        }
      }
    }
    pinMode(Sakura,INPUT);   //ポートをINPUTに戻しておく
    data_count=0;           //送信データ数クリア
  }

  if(Eneloop>4.0)  WriteSD();  //電池電圧が4.0V以上の時のみSD書きだし   


//Eneloop電池電圧が5.9V以上で日射量があるとき、電流測定回路をONにして過充電を防止する。
  val[1]=ReadSens_ch(1,4,50);      //Eneloop電圧AD1の4回平均値(個別ch, 読取回数, intarvalms)(delay200も兼ねている)
  Eneloop=val[1]*Eneloop_const;
  if (Eneloop>6.0 ){
    digitalWrite(TRON,HIGH);//TR ON  電流測定回路ON 
    digitalWrite(FanOn,LOW);//TR ONの間FANのBT駆動ON
    Reg_flag =1;
  }

  do{
    INT_flag= 0; //スリープ後のスリープ復帰判断用にINT_flagを初期化  //anan Sleep中のWDT 8秒割り込みの対応
    INT_count =0;   // 割り込みカウントをクリア
    //Sleep mode Setup
    system_sleep();
    if( Reg_flag >=1 ){
      if (Eneloop_const*ReadSens_ch(1,1,10)>6.0){
        digitalWrite(FanOn,LOW);//TR ONの間FANのBT駆動ON
        digitalWrite(TRON,HIGH);//TR ON  電流測定回路ON
        Reg_flag++; 
      }else{
        digitalWrite(TRON,LOW);//TR OFF  電流測定回路OFF        
        digitalWrite(FanOn,HIGH);//FANのBT駆動OFF
      }
    }
    
    if(INT_flag==1 && wdt_cycle < timeout_count5/2 )  INT_flag=0; //WDT割込直後のRTC割込を無視
  }while(INT_flag==0);  //sleepからRTC割込（INT_flag>0）の時抜ける

  RtcCount++; //RTCからの割り込み回数のカウント
  wdt_cycle=0;       //WDTのカウントをリセット
  //Initialization
  Cont_flg = Cont_flg & ~Initialization;			//Initializationフラグを0にする
  if ((RtcCount >= 12 && Radiation > 0) || RtcCount >=24) RtcCount = 0;           //12×5分(1時間)経過していて日が出ていたらcount初期化 二時間経っても初期化
  if(RtcCount == 12){                                                             //RtcCountが12に入った=日が出ていないので二時間の送信タイミングに変更      
    for(int i=0; i<=data_count; i++)Offtime[i]+=3600;                             //今まで蓄積しているデータを+60分オフセットする
  }
}

boolean connectLTE(){ //Sakura.ioをLTE回線に接続
  for(byte timeout=0; timeout<=13; timeout++){     //8秒sleep×13(104秒でタイムアウト)
    Serial.print(sakuraio.getConnectionStatus());
    if( (sakuraio.getConnectionStatus() & 0x80) == 0x80 ){
      Serial.print("\nConnect!:");
      Serial.println(millis()+timeout*8000);
      connectDelay = (millis()+timeout*8000) - connectDelay; //遅延時間を計測
      if(connectDelay>=120000)connectDelay=0;//2分以上であれば無視する
      return true;//接続に成功
      break;
    }
    system_sleep();
  }
  
  //接続に失敗
  Serial.println("\nConnect failed!");
  connectDelay = 0;
  return false; 
}

void sakuraEnqueueTx(){ //蓄積されているデータをSakura.ioシールドのキューに送る
  for(int n=0; data_count>=1 && n<16; data_count--,n++){
    sakuraio.enqueueTx(Cha[data_count-1],Data[data_count-1],(long)Offtime[n]*1000+connectDelay);
    Serial.print(Cha[data_count-1]);
    Serial.println(" enqueue OK");
  }
}

void save_queue(byte s_ch, float s_data,int off_count){ //Arduino内にデータを蓄積する
  Cha[data_count]=s_ch;
  Data[data_count]=s_data;
  Offtime[data_count]=off_count;
  data_count++;
}

void system_sleep() {                   // システム停止
  cbi(ADCSRA, ADEN);                    // ADC 回路電源をOFF (ADC使って無くても120μA消費するため）
  set_sleep_mode(SLEEP_MODE_PWR_DOWN);  // パワーダウンモード
  sleep_enable();
  sleep_mode();                         // ここでスリープに入る
  sleep_disable();       // RTCからの割り込みが発生したらここから動作再開
  sbi(ADCSRA, ADEN);     // ADC ON
}

double Humidity() {      //湿度測定
  Wire.beginTransmission(SHT2x);
  Wire.write(CMD_RH);
  Wire.endTransmission();
  Wire.requestFrom(SHT2x, 2);    // request 6 bytes from slave device #2
  unsigned long data = 0;
  for (int i = 0; i < 2 && Wire.available(); ++i) // slave may send less than requested
  {
    unsigned char c = Wire.read(); // receive a byte as character
    data += (unsigned long)c << ((1 - i) * 8);
  }
  humidity = 125.0 * (double)data / 65536 - 6.0;

  return humidity;
}

double Temperature() {     //温度測定
  Wire.beginTransmission(SHT2x);
  Wire.write(CMD_TEMP);
  Wire.endTransmission();
  Wire.requestFrom(SHT2x, 2);    // request 6 bytes from slave device #2
  unsigned long data = 0;
  for (int i = 0; i < 2 && Wire.available(); ++i) // slave may send less than requested
  {
    unsigned char c = Wire.read(); // receive a byte as character
    data += (unsigned long)c << ((1 - i) * 8);
  }

  return (175.72 * (double)data / 65536 - 46.85);
}

void WriteSD(){         //SD書込
  SD.begin(chipSelect);

  File dataFile = SD.open("btvilog1.csv",FILE_WRITE);

  // if the file is available, writ
  if (dataFile) {


    dataFile.print(Time_m) ;                   //計測開始時の時刻を出力
    dataFile.print(',');
    dataFile.print(temperature);
    dataFile.print(',');
    dataFile.print(humidity);
    dataFile.print(',');
    dataFile.print(Radiation);       //2Wパネル太陽電池で計測した日射量を出力
    dataFile.print(",");  
//    dataFile.print(soilmoist);                        //soilmoist
//    dataFile.print(",");  
    dataFile.print(Eneloop);                        //Eneloop電池電圧
    dataFile.print(",");  
    dataFile.print(val[0]);
    dataFile.print(',');
    dataFile.print(val[1]);
    dataFile.print(',');
    dataFile.print(val[2]);
    dataFile.print(',');
    dataFile.print(val[3]); 
    dataFile.print(',');
    dataFile.print(connectDelay); 
    dataFile.print(',');
    dataFile.print(sendDelay); 
    dataFile.print(',');
    
    
    
    if ( Cont_flg & Initialization == 1){
      dataFile.print("Time");
      dataFile.print(',');
      dataFile.print("Temp");
      dataFile.print(',');
      dataFile.print("Humidi");
      dataFile.print(',');
//      dataFile.print("Radiation_2W");
//      dataFile.print(",");  
      dataFile.print("soilmoist");              
      dataFile.print(",");  
      dataFile.print("V_Eneloop");              
      dataFile.print(",");  
      dataFile.print("Ana0");
      dataFile.print(',');
      dataFile.print("Ana1");
      dataFile.print(',');
      dataFile.print("Ana2");
      dataFile.print(',');
      dataFile.print("Ana3");
      dataFile.print(',');
      dataFile.print("connectDelay");
      dataFile.print(',');
      dataFile.print("sendDelay");
      dataFile.print(',');
      dataFile.print(VernNo);
     
    };
    dataFile.println("");      //改行
    dataFile.close();

  }
}

float ReadSens_ch(int ch, int n, int intarvalms){   //AD測定用メソッド
        int sva =0;
        for (int i = 0; i <n ; i++){ //n回平均
            delay(intarvalms);
            sva = (analogRead(ch) + sva);
        }
        return sva/n;
}

String GetTime(int n){
    String Time;
    byte tm[7] ; 
    char buf[24] ;
    RTC.rTime(tm) ;                       // RTCからSD書き込み時刻を読込む
    RTC.cTime(tm,(byte *)buf) ;           // 日付と時刻を文字列に変換する
    Time = buf;
    Time.setCharAt(11, ' ');                  // 曜日を削除して時刻を出力
    Time.setCharAt(12, ' ');                  // 曜日を削除して時刻を出力
    Time.setCharAt(13, ' ');                  // 曜日を削除して時刻を出力
    if(n>0) Time=Time.substring(n);
    return Time;
}
void WDT_setup8() {  // ウォッチドッグタイマーをセット。
  // WDTCSRにセットするWDP0-WDP3の値。9=8sec
  byte bb = 9;
  bb =bb & 7;                          // 下位3ビットをbbに
  bb |= (1 << 5);                     // bbの5ビット目(WDP3)を1にする
  bb |= ( 1 << WDCE );
  MCUSR &= ~(1 << WDRF);                // MCU Status Reg. Watchdog Reset Flag ->0
  // start timed sequence
  WDTCSR |= (1 << WDCE) | (1<<WDE);     // ウォッチドッグ変更許可（WDCEは4サイクルで自動リセット）
  // set new watchdog timeout value
  WDTCSR = bb;                          // 制御レジスタを設定
  WDTCSR |= _BV(WDIE);
} 

ISR(WDT_vect) {                         // WDTがタイムアップした時に実行される処理
  wdt_cycle++;                        
  if (wdt_cycle >= timeout_count5) { // timeout_count5(x8秒)以上経過したらSleepから抜けるフラグINT_flagセット
    wdt_cycle=0;                        
    INT_flag = 2;
    INT_count++;   // 割り込みカウントをインクリメント(フリーズ対応)
    if (INT_count >= 12) { //5分ｘ12(60分)以上経過したらソフトリセット
       software_Reset();
    }
  }
}

void software_Reset(){
  asm volatile("  jmp 0");
}
