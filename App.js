/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  ListItem,
  AsyncStorage,
  Alert,
  Image
} from 'react-native';
import { Picker, Item, Label, Spinner, Badge } from 'native-base';
import FListItem from './listItem';
import MyDate from './date';
import { Col, Row, Grid } from "react-native-easy-grid";
const mqtt = require('react-native-mqtt');
let currentSlice = 0;
let endSilce = 5;
const numberRow = 5;
let interval = null;
let arrMachine = [];
let subInterVal = [];
const mqttClient = null;
const newMesTimeout = null;
const connectInterval = null;
const connectMessageInterval = null;
const timeOutChange = null;
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
const clientId = "";
export default class App extends Component {
  constructor(props) {
    super(props)
    let lcd = "";

    this.state = {
      messageData: null,
      showTable: true,
      tableData: [],
      arrayShow: [],
      selected1: lcd,
      department: '',
      loadding: true,
      newMessage: false,
      change: 0,
      arrLCD: [],
      arrDepartment: [],
      appError: null
    }

  }

  componentDidMount() {
    let arrLCD = [];
    let arrDepartment = [];
    this.getLCD_department()
    this.createClientMessage();
  }

  async getLCD_department() {
    let arrLCD = [];
    let arrDepartment = [];
    try {
      let responseLCD = await fetch("http://113.171.23.140:8081/manuafactory/api/devices/all", {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json'
        }, ),
        async: false
      })
      arrLCD = await responseLCD.json()
      if (arrLCD.length <= 0) {
        this.setState({ appError: "Không có LCD nào trong dữ liệu, vui lòng tạo LCD vào khởi động lại app." });
      }

    } catch (error) {
      this.setState({ appError: "Ko lấy được danh sách LCD kiểm tra lại kết nối." });
    }
    try {
      let responsedepartment = await fetch("http://113.171.23.140:8081/manuafactory/api/department/load-all", {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json'
        }, ),
        async: false
      })
      arrDepartment = await responsedepartment.json()
      if (arrDepartment.length <= 0) {
        this.setState({ appError: "Không có bộ phận nào trong dữ liệu, vui lòng tạo bộ phận vào khởi động lại app." });
      }

    } catch (error) {
      this.setState({ appError: "Ko lấy được danh sách bộ phận kiểm tra lại kết nối." });
    }
    if (arrLCD.length > 0 && arrDepartment.length > 0) {
      AsyncStorage.multiGet(['@LCD', '@department'], (err, values) => {
        let lcd = "";
        let department = "";
        if (values.length > 0) {
          values.map((result, i, store) => {
            let key = store[i][0];
            let value = store[i][1];
            if (key == "@LCD" && value != null && value != '') {
              lcd = value;
            }
            else if (key == "@department" && value != null && value != '') {
              department = value;
              // this.setState({ arrLCD: arrDepartment, department: value });
              // this.createClient(value);
            }
          });

          if (this.checkExitsInArr(lcd, arrLCD, 'deviceTopic') == false) {
            lcd = arrLCD[0].deviceTopic;
          }
          if (this.checkExitsInArr(department ? Number(department) : 0, arrDepartment, 'departmentId') == false) {
            department = arrDepartment[0].departmentId;
          }
          if (department != '' && department != null && lcd != "" && lcd != null) {
            this.setState({ arrDepartment: arrDepartment, arrLCD: arrLCD, department: Number(department), selected1: lcd });
            this.createClient(lcd, department);
          }
          else if ((department == '' || department == null) && (lcd != "" && lcd != null)) {
            this.setState({ arrDepartment: arrDepartment, arrLCD: arrLCD, department: arrDepartment[0].departmentId, selected1: lcd });
            this.createClient(lcd, arrDepartment[0].departmentId);
          }
          else if (department != '' && department != null && (lcd == "" || lcd == null)) {
            this.setState({ arrDepartment: arrDepartment, arrLCD: arrLCD, department: Number(department), selected1: arrLCD[0].deviceTopic });
            this.createClient(arrLCD[0].deviceTopic, department);
          }
          else {
            this.setState({ arrDepartment: arrDepartment, arrLCD: arrLCD, department: arrDepartment[0].departmentId, selected1: arrLCD[0].deviceTopic });
            this.createClient(arrLCD[0].deviceTopic, arrDepartment[0].departmentId);
          }
        }
        else {
          this.setState({ arrDepartment: arrDepartment, arrLCD: arrLCD, department: arrDepartment[0].departmentId, selected1: arrLCD[0].deviceTopic });
          this.createClient(arrLCD[0].deviceTopic, arrDepartment[0].departmentId);
        }
      }).catch(() => {
        this.setState({ arrDepartment: arrDepartment, arrLCD: arrLCD, department: arrDepartment[0].departmentId, selected1: arrLCD[0].deviceTopic });
        this.createClient(arrLCD[0].deviceTopic, arrDepartment[0].departmentId);
      })
    }
  }

  checkExitsInArr(lcd, arrLcd, propety) {
    let lcdItem = {};
    for (var i = 0; i < arrLcd.length; i++) {
      lcdItem = arrLcd[i];
      if (lcdItem[propety] == lcd) {
        return true;
        break;
      }
    }
    return false;
  }

  createClientMessage() {
    /* create mqtt client */
    clientId = guid();
    mqtt.createClient({
      uri: 'tcp://113.171.23.140:1883',
      clientId: clientId,
      keepalive: 60
    }).then((client) => {
      mqttClient = client;
      client.on('closed', () => {
        this.setState({ appError: 'kết nối đến server đã đóng' });
        if (!mqttClient) {
          this.setState({ appError: 'kết nối đến server đã đóng' });
        }
        if (!connectMessageInterval) {
          connectMessageInterval = setInterval(() => {
            this.reconnectMessage();
          }, 30000)
        }
      });
      client.on('error', (msg) => {
        this.setState({ appError: "Lỗi: kết nối đến server thất bại." });
        if (!connectMessageInterval) {
          connectMessageInterval = setInterval(() => {
            this.reconnectMessage();
          }, 30000)
        }
      });

      client.on('message', this.onMessageMqttMessage.bind(this));

      //let req = { request: { topic: topic, department: departmentId, clientId: clientId } };

      client.on('connect', () => {
        this.setState({ appError: null });
        if (connectMessageInterval) {
          clearInterval(connectMessageInterval);
        }
        client.subscribe('tcp/listen/message', 2);
        // client.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
      });

      client.connect();
    }).catch((err) => {
      this.setState({ appError: "Lỗi: kết nối đến server thất bại." });
      if (connectMessageInterval) {
        clearInterval(connectMessageInterval);
      }
      connectMessageInterval = setInterval(() => {
        this.reconnectMessage();
      }, 30000)
    });
  }

  createClient(topic, departmentId) {
    /* create mqtt client */
    clientId = guid();
    mqtt.createClient({
      uri: 'tcp://113.171.23.140:1883',
      clientId: clientId,
      keepalive: 60
    }).then((client) => {
      mqttClient = client;
      client.on('closed', () => {
        this.setState({ appError: 'kết nối đến server đã đóng' });
        if (!mqttClient) {
          this.setState({ appError: 'kết nối đến server đã đóng' });
        }
        if (!connectInterval) {
          connectInterval = setInterval(() => {
            this.reconnect(topic, departmentId);
          }, 30000)
        }
      });
      client.on('error', (msg) => {
        this.setState({ appError: "Lỗi: kết nối đến server thất bại." });
        if (!connectInterval) {
          connectInterval = setInterval(() => {
            this.reconnect(topic, departmentId);
          }, 30000)
        }
      });

      client.on('message', this.onMessageMqtt.bind(this));

      let req = { request: { topic: topic, department: departmentId, clientId: clientId } };

      client.on('connect', () => {
        this.setState({ appError: null });
        if (connectInterval) {
          clearInterval(connectInterval);
        }
        client.subscribe('tcp/incoming/' + topic, 2);
        client.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
      });

      client.connect();
    }).catch((err) => {
      this.setState({ appError: "Lỗi: kết nối đến server thất bại." });
      if (connectInterval) {
        clearInterval(connectInterval);
      }
      connectInterval = setInterval(() => {
        this.reconnect(topic, departmentId);
      }, 30000)
    });
  }

  reconnectMessage() {
    clientId = guid();
    this.setState({ appError: 'đang kết nối lại server' });
    mqtt.createClient({
      uri: 'tcp://113.171.23.140:1883',
      clientId: clientId,
      keepalive: 60
    }).then((client) => {
      mqttClient = client;
      client.on('closed', () => {
        this.setState({ appError: 'kết nối đến server đã đóng' });
      });
      client.on('error', (msg) => {
        this.setState({ appError: "Lỗi: kết nối đến server thất bại." });
      });
      client.on('message', this.onMessageMqttMessage.bind(this));
      //let req = { request: { topic: topic, department: departmentId, clientId: clientId } };
      client.on('connect', () => {
        this.setState({ appError: null });
        if (connectMessageInterval) {
          clearInterval(connectMessageInterval);
        }
        client.subscribe('tcp/listen/message', 2);
        //client.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
      });
      client.connect();
    }).catch((err) => {
      this.setState({ appError: "Lỗi: kết nối đến server thất bại." });
    });
  }

  reconnect(topic, departmentId) {
    clientId = guid();
    this.setState({ appError: 'đang kết nối lại server' });
    mqtt.createClient({
      uri: 'tcp://113.171.23.140:1883',
      clientId: clientId,
      keepalive: 60
    }).then((client) => {
      mqttClient = client;
      client.on('closed', () => {
        this.setState({ appError: 'kết nối đến server đã đóng' });
      });
      client.on('error', (msg) => {
        this.setState({ appError: "Lỗi: kết nối đến server thất bại." });
      });
      client.on('message', this.onMessageMqtt.bind(this));
      let req = { request: { topic: topic, department: departmentId, clientId: clientId } };
      client.on('connect', () => {
        this.setState({ appError: null });
        if (connectInterval) {
          clearInterval(connectInterval);
        }
        client.subscribe('tcp/incoming/' + topic, 2);
        client.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
      });
      client.connect();
    }).catch((err) => {
      this.setState({ appError: "Lỗi: kết nối đến server thất bại." });
    });
  }

  onMessageMqtt(msg) {
    AsyncStorage.setItem("@tableData", msg.data);
    this.bindInterVal(msg);

  }

  onMessageMqttMessage(msg) {
    AsyncStorage.setItem("@messageData", msg.data);
    const msgObj = JSON.parse(msg.data);
    if (timeOutChange) {
      clearTimeout(timeOutChange);
    }
    var remainTime = this.countRemainTimer(msgObj.message.endTime);
    if (remainTime > 0) {
      this.setState({ showTable: false, messageData: msgObj.message })
      //

      timeOutChange = setTimeout(() => {
        this.setState({ showTable: true })
      }, remainTime * 1000);
    }
  }

  countRemainTimer(dt) {
    var end = new Date(dt);

    var _second = 1000;
    var _minute = _second * 60;
    var _hour = _minute * 60;
    var _day = _hour * 24;
    var timer;
    var now = new Date();
    var distance = end - now;
    if (distance < 0) {
      return 0;
    }
    var days = Math.floor(distance / _day);
    var hours = Math.floor((distance % _day) / _hour);
    var minutes = Math.floor((distance % _hour) / _minute);
    var seconds = Math.floor((distance % _minute) / _second);
    var remainSecond = (days * 86400) + (hours * 3600) + (minutes * 60) + seconds
    console.log('remain :' + remainSecond);
    return remainSecond;
  }

  bindInterVal(msg) {
    const msgObj = JSON.parse(msg.data);
    let tableData = msgObj.data;
    if (msgObj.clientId != clientId && msgObj.clientId != "all") {
      return;
    }
    if (interval) {
      window.clearInterval(interval);
    }
    if (subInterVal) {
      window.clearInterval(subInterVal);
    }
    const objTableData = this.bindArrMachine(tableData);
    subInterVal = window.setInterval(() => {
      //console.log('change array');
      for (var i = 0; i < objTableData.arrMultilMachine.length; i++) {
        let arrMulti = objTableData.arrMultilMachine[i];
        for (var j = 0; j < arrMulti.length; j++) {
          let item = arrMulti[j];
          let nextItem = {};
          if (j == arrMulti.length - 1) {
            nextItem = arrMulti[0];
          }
          else {
            nextItem = arrMulti[j + 1];
          }
          if (this.state.arrayShow.indexOf(item) > -1 && objTableData.arrSingleMachine.indexOf(item) > -1) {
            objTableData.arrSingleMachine[objTableData.arrSingleMachine.indexOf(item)] = nextItem;
            break;
          }
        }
      }
      let tempCurrentSlice = 0;
      let tempEndSilce = 0;
      if (currentSlice < numberRow) {
        tempCurrentSlice = objTableData.arrSingleMachine.length - numberRow;
      }
      else {
        tempCurrentSlice = currentSlice - numberRow;
      }
      if (endSilce == numberRow) {
        tempEndSilce = objTableData.arrSingleMachine.length;
      }
      else {
        tempEndSilce = endSilce - numberRow;
      }
      let arrayShow = objTableData.arrSingleMachine.slice(tempCurrentSlice, tempEndSilce);
      if (arrayShow.length == this.state.arrayShow.length &&
        arrayShow.length > 0 && arrayShow[0].machine.machineId == this.state.arrayShow[0].machine.machineId) {
        this.setState({
          arrayShow: arrayShow,
          change: this.state.change == 0 ? 1 : 0
        })
      }
    }, 3000);
    currentSlice = 0;
    endSilce = 5;
    const arrayShow = objTableData.arrSingleMachine.slice(currentSlice, endSilce);
    currentSlice = currentSlice + numberRow;
    endSilce = endSilce + numberRow;
    if (currentSlice >= objTableData.arrSingleMachine.length) {
      currentSlice = 0;
      endSilce = 5;
    }
    this.setState({
      newMessage: true,
      arrayShow: arrayShow,
      loadding: false
    })
    interval = window.setInterval(() => {
      const arrayShow = objTableData.arrSingleMachine.slice(currentSlice, endSilce);
      currentSlice = currentSlice + numberRow;
      endSilce = endSilce + numberRow;
      if (currentSlice >= objTableData.arrSingleMachine.length) {
        currentSlice = 0;
        endSilce = 5;
      }
      this.setState({
        arrayShow: arrayShow,
        loadding: false
      })
    }, 13000)
    if (newMesTimeout) {
      clearTimeout(newMesTimeout);
    }
    newMesTimeout = setTimeout(() => {
      this.setState({
        newMessage: false
      })
    }, 15000);
  }

  bindArrMachine(tableData) {
    let temArr = [];
    let arrSingleMachine = [];
    let arrPushedMachine = [];
    let arrMultilMachine = [];
    for (var i = 0; i < tableData.length; i++) {
      let itemI = tableData[i];
      temArr = [];
      if (arrSingleMachine.indexOf(itemI) == -1 && arrPushedMachine.indexOf(itemI.machine.machineId) == -1) {
        arrSingleMachine.push(itemI);
      }
      if (arrPushedMachine.indexOf(itemI.machine.machineId) == -1) {
        arrPushedMachine.push(itemI.machine.machineId);
        for (var j = i + 1; j < tableData.length; j++) {
          let itemJ = tableData[j];
          if (itemJ.machine.machineId == itemI.machine.machineId) {
            if (temArr.indexOf(itemI) == -1) {
              temArr.push(itemI);
            }
            temArr.push(itemJ);
          }
        }
      }
      if (temArr.length > 0) {
        arrMultilMachine.push(temArr);
      }
    }
    return {
      arrMultilMachine: arrMultilMachine,
      arrSingleMachine: arrSingleMachine
    };
  }

  render() {
    const {
      tableData,
      arrayShow,
      newMessage,
      arrLCD,
      arrDepartment,
      appError,
      showTable,
      messageData
    } = this.state;
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        {/* this.state.loadding */}
        {this.state.loadding ? <View style={{
          position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, justifyContent: 'center',
          alignItems: 'center', zIndex: 99999
        }}>
          <Spinner size={60} />
        </View> : null}
        {
          showTable?
            <View style={{ flex: 1 }}>
              <View style={styles.rowTitle}>
                <View style={styles.rowTitleCon}>
                  <View style={styles.logoCon}>
                    <Text style={styles.logoTitle}>ASIA DRAGON CORD & TWINE</Text>
                    <Item style={styles.itemBorderNone}>
                      <Text style={styles.logoTitle}>BP: </Text>
                      <Picker
                        style={{ width: 260, height: 30, color: "#e7fdfd" }}
                        iosHeader="Select one"
                        mode="dropdown"
                        selectedValue={this.state.department}
                        onValueChange={this.ondepartmentChange.bind(this)}
                      >
                        {
                          arrDepartment.map((item, index) => {
                            return (<Item key={index} label={item.departmentName} value={item.departmentId} />)
                          })
                        }
                      </Picker></Item>
                    <Item style={styles.itemBorderNone}>
                      <Text style={styles.logoTitle}>LCD: </Text>
                      <Picker
                        style={{ width: 248, height: 30, color: "#e7fdfd" }}
                        iosHeader="Select one"
                        mode="dropdown"
                        selectedValue={this.state.selected1}
                        onValueChange={this.onValueChange.bind(this)}
                      >
                        {
                          arrLCD.map((item, index) => {
                            return (<Item key={index} label={item.deviceName} value={item.deviceTopic} />)
                          })
                        }
                      </Picker>
                    </Item>
                  </View>
                  <View style={styles.titleCon}>
                    <Text style={styles.title}>BẢNG THEO DÕI SẢN XUẤT</Text>
                    {newMessage ?
                      <Badge style={{
                        backgroundColor: '#00A000', position: 'absolute',
                        bottom: 3, opacity: 0.8,
                        right: 0, justifyContent: 'center', marginTop: 6
                      }}>
                        <Text style={{ fontSize: 22 }}>Dữ liệu mới nhận</Text>
                      </Badge> : null}
                  </View>
                  <View style={styles.dateCon}>
                    <MyDate></MyDate>
                  </View>
                </View>

              </View>

              <Grid style={{ flex: 1, paddingRight: 2 }}>
                <Row style={{ maxHeight: 90 }}>
                  <Col style={{
                    borderWidth: 0.25, borderColor: '#d6d7da', justifyContent: 'center', width: 90
                  }}>
                    <Text style={styles.text}>Máy</Text>
                  </Col>
                  <Col style={[styles.colBorder, { justifyContent: 'center' }]}>
                    <Text style={styles.text}>Đơn hàng</Text>
                  </Col>
                  <Col style={[styles.colBorder, { justifyContent: 'center' }]}>
                    <Text style={styles.text}>Code BTP</Text>
                  </Col>
                  <Col style={[styles.colBorder, { justifyContent: 'center' }]}>
                    <Text style={styles.text}>Màu</Text>
                  </Col>
                  <Col style={[styles.colBorder, { justifyContent: 'center' }]}>
                    <Text style={styles.text}>Denier</Text>
                  </Col>
                  <Col style={[styles.colBorder, { justifyContent: 'center' }]}>
                    <Text style={styles.text}>K.Hoạch Kg</Text>
                  </Col>
                  <Col style={[styles.colBorder, { justifyContent: 'center' }]}>
                    <Text style={styles.text}>Đã SX Kg</Text>
                  </Col>
                  <Col style={[styles.colBorder, { justifyContent: 'center' }]}>
                    <Text style={styles.text}>Còn lại Kg</Text>
                  </Col>
                  <Col style={{
                    borderWidth: 0.25, borderColor: '#d6d7da', justifyContent: 'center', width: 100
                  }}>
                    <Text style={styles.text}>Ngày sản xuất</Text>
                  </Col>
                  <Col style={{
                    borderWidth: 0.25, borderColor: '#d6d7da', justifyContent: 'center', width: 100
                  }}>
                    <Text style={styles.text}>Ngày hoàn thành</Text>
                  </Col>
                  <Col style={{
                    borderWidth: 0.25, borderColor: '#d6d7da', justifyContent: 'center', width: 100
                  }}>
                    <Text style={styles.text}>Ngày xuất hàng</Text>
                  </Col>
                </Row>
                <Row>
                  <FlatList
                    style={{ marginBottom: 4 }}
                    data={arrayShow}
                    keyExtractor={this._keyExtractor}
                    renderItem={this.renderRow.bind(this)}
                  /></Row>
              </Grid>
            </View> :
            messageData.contentType == "TEXT" ?
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontSize: 28, marginTop: 6 }}> {messageData.messageTitle}</Text>
                <View style={{ flex: 1,paddingLeft:8 }}>
                  <Text style={{ color: '#fff', textAlign: 'left', fontSize: 25 }}> {messageData.messageContent}</Text>
                </View>
              </View> :
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  resizeMode="contain"
                  style={{ width: '100%', height: '100%' }}
                  source={{ uri: messageData.messageImageUrl }}
                />
              </View>
        }

        <Text style={{ position: "absolute", bottom: 25, left: 5, color: "#fff", fontSize: 15, zIndex: 99999 }}>{appError ? appError : ""}</Text>
      </View >
    )
  }

  onValueChange(value) {
    AsyncStorage.setItem('@LCD', value);
    if (interval) {
      window.clearInterval(interval);
    }
    if (subInterVal) {
      window.clearInterval(subInterVal);
    }

    this.setState({
      selected1: value,
      loadding: true
    });
    let req = { request: { topic: value, department: this.state.department, clientId: clientId } };
    if (!mqttClient) {
      this.createClient(value);
    }
    else {
      mqttClient.subscribe('tcp/incoming/' + value, 2);
      mqttClient.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
    }

    //this.createClient(value);
  }

  ondepartmentChange(value) {
    AsyncStorage.setItem('@department', value.toString());
    if (interval) {
      window.clearInterval(interval);
    }
    if (subInterVal) {
      window.clearInterval(subInterVal);
    }
    this.setState({
      department: value,
      loadding: true
    });

    let req = { request: { topic: this.state.selected1, department: value, clientId: clientId } };
    if (!mqttClient) {
      this.createClient(value);
    }
    else {
      mqttClient.subscribe('tcp/incoming/' + value, 2);
      mqttClient.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
    }
  }

  _keyExtractor(item, index) {
    return index;
  }

  renderRow(dataItem) {
    return (
      <FListItem key={dataItem.index} dataItem={dataItem.item} />
    );
  }

}

const styles = StyleSheet.create({
  colBorder: {
    borderWidth: 0.25,
    borderColor: '#d6d7da',
  },
  itemBorderNone: {
    borderBottomWidth: 0
  },
  rowTitle: {
    width: "100%",
    height: 100,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  head: { minHeight: 50, backgroundColor: '#f1f8ff' },
  rowTitleCon: {
    flex: 1,
    flexDirection: 'row'
  },
  logoTitle: {
    color: "#e7fdfd",
    fontSize: 22
  },
  logoCon: {
    width: 350,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleCon: {
    justifyContent: 'center',
    flex: 1
  },
  title: {
    color: '#fff',
    fontSize: 35
  },
  dateCon: {
    width: 140,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: { marginLeft: 5, textAlign: 'center' },
  rowHeader: { height: 100 },
  row: { height: 50 },
  text: { color: '#efc373', fontSize: 22, textAlign: 'center' }
});
