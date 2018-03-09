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
  Alert
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
    clientId = guid();
    this.state = {
      tableData: [],
      arrayShow: [],
      selected1: lcd,
      segment: '',
      loadding: true,
      newMessage: false,
      change: 0,
      arrLCD: [],
      arrSegment: []
    }

  }

  componentDidMount() {
    let arrLCD = [];
    let arrSegment = [];
    this.getLCD_Segment()
  }

  async getLCD_Segment() {
    let arrLCD = [];
    let arrSegment = [];
    try {
      let responseLCD = await fetch("http://113.171.23.140/manuafactory/api/devices/all", {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json'
        }, ),
        async: false
      })
      arrLCD = await responseLCD.json()
      if (arrLCD.length <= 0) {
        Alert.alert("Thông báo", "Không có LCD nào trong dữ liệu, vui lòng tạo LCD vào khởi động lại app.");
      }

    } catch (error) {
      Alert.alert("Thông báo", "Ko lấy được danh sách LCD kiểm tra lại kết nối.");
    }
    try {
      let responseSegment = await fetch("http://113.171.23.140/manuafactory/api/segments/", {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json'
        }, ),
        async: false
      })
      arrSegment = await responseSegment.json()
      if (arrSegment.length <= 0) {
        Alert.alert("Thông báo", "Không có Ca nào trong dữ liệu, vui lòng tạo Ca vào khởi động lại app.");
      }

    } catch (error) {
      Alert.alert("Thông báo", "Ko lấy được danh sách Ca kiểm tra lại kết nối.");
    }
    if (arrLCD.length > 0 && arrSegment.length > 0) {
      AsyncStorage.multiGet(['@LCD', '@SEGMENT'], (err, values) => {
        let lcd = "";
        let segment = "";
        if (values.length > 0) {
          values.map((result, i, store) => {
            let key = store[i][0];
            let value = store[i][1];
            if (key == "@LCD" && value != null && value != '') {
              lcd = value;
            }
            else if (key == "@SEGMENT" && value != null && value != '') {
              segment = value;
              // this.setState({ arrLCD: arrSegment, segment: value });
              // this.createClient(value);
            }
          });
          if (this.checkExitsInArr(lcd, arrLCD, 'deviceTopic') == false) {
            lcd = arrLCD[0].deviceTopic;
          }
          if (this.checkExitsInArr(lcd, arrLCD, 'segmentId') == false) {
            segment = arrSegment[0].segmentId;
          }
          if (segment != '' && segment != null && lcd != "" && lcd != null) {
            this.setState({ arrSegment: arrSegment, arrLCD: arrLCD, segment: Number(segment), selected1: lcd });
            this.createClient(lcd, segment);
          }
          else if ((segment == '' || segment == null) && (lcd != "" && lcd != null)) {
            this.setState({ arrSegment: arrSegment, arrLCD: arrLCD, segment: arrSegment[0].segmentId, selected1: lcd });
            this.createClient(lcd, arrSegment[0].segmentId);
          }
          else if (segment != '' && segment != null && (lcd == "" || lcd == null)) {
            this.setState({ arrSegment: arrSegment, arrLCD: arrLCD, segment: Number(segment), selected1: arrLCD[0].deviceTopic });
            this.createClient(arrLCD[0].deviceTopic, segment);
          }
          else {
            this.setState({ arrSegment: arrSegment, arrLCD: arrLCD, segment: arrSegment[0].segmentId, selected1: arrLCD[0].deviceTopic });
            this.createClient(arrLCD[0].deviceTopic, arrSegment[0].segmentId);
          }
        }
        else {
          this.setState({ arrSegment: arrSegment, arrLCD: arrLCD, segment: arrSegment[0].segmentId, selected1: arrLCD[0].deviceTopic });
          this.createClient(arrLCD[0].deviceTopic, arrSegment[0].segmentId);
        }
      }).catch(() => {
        this.setState({ arrSegment: arrSegment, arrLCD: arrLCD, segment: arrSegment[0].segmentId, selected1: arrLCD[0].deviceTopic });
        this.createClient(arrLCD[0].deviceTopic, arrSegment[0].segmentId);
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

  createClient(topic, segmentId) {
    /* create mqtt client */
    mqtt.createClient({
      uri: 'tcp://113.171.23.202:1883',
      clientId: 'tcp/incoming/' + topic + "/" + clientId
    }).then((client) => {
      mqttClient = client;
      client.on('closed', function () {
        alert('kết nối đến server đã đóng');

      });
      client.on('error', function (msg) {
        alert('Lỗi: ', msg);
      });

      client.on('message', this.onMessageMqtt.bind(this));

      let req = { request: { topic: topic, segment: segmentId, clientId: clientId } };

      client.on('connect', function () {
        client.subscribe('tcp/incoming/' + topic, 2);
        client.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
      });

      client.connect();
    }).catch(function (err) {
      alert(err);
    });
  }

  onMessageMqtt(msg) {

    AsyncStorage.setItem("@tableData", msg.data);
    this.bindInterVal(msg);

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
        arrayShow.length > 0 && arrayShow[0].machine == this.state.arrayShow[0].machine) {
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
      if (arrSingleMachine.indexOf(itemI) == -1 && arrPushedMachine.indexOf(itemI.machine) == -1) {
        arrSingleMachine.push(itemI);
      }
      if (arrPushedMachine.indexOf(itemI.machine) == -1) {
        arrPushedMachine.push(itemI.machine);
        for (var j = i + 1; j < tableData.length; j++) {
          let itemJ = tableData[j];
          if (itemJ.machine == itemI.machine) {
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
    const { tableData, arrayShow, newMessage, arrLCD, arrSegment } = this.state;
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        {/* this.state.loadding */}
        {this.state.loadding ? <View style={{
          position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, justifyContent: 'center',
          alignItems: 'center', zIndex: 99999
        }}>
          <Spinner size={60} />
        </View> : null}
        <View style={styles.rowTitle}>
          <View style={styles.rowTitleCon}>
            <View style={styles.logoCon}>
              <Text style={styles.logoTitle}>ASIA DRAGON CORD & TWINE</Text>
              <Item>
                <Text style={styles.logoTitle}>Ca: </Text>
                <Picker
                  style={{ width: 90, height: 30, color: "#e7fdfd" }}
                  iosHeader="Select one"
                  mode="dropdown"
                  selectedValue={this.state.segment}
                  onValueChange={this.onSegmentChange.bind(this)}
                >
                  {
                    arrSegment.map((item, index) => {
                      return (<Item key={index} label={item.segmentName} value={item.segmentId} />)
                    })
                  }
                </Picker></Item>
              <Item style={styles.itemBorderNone}>
                <Text style={styles.logoTitle}>Màn hình: </Text>
                <Picker
                  style={{ width: 110, height: 30, color: "#e7fdfd" }}
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
            <Col style={[styles.colBorder, { justifyContent: 'center' }]}>
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
              data={arrayShow}
              keyExtractor={this._keyExtractor}
              renderItem={this.renderRow.bind(this)}
            /></Row>
        </Grid>
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
    debugger;
    this.setState({
      selected1: value,
      loadding: true
    });
    let req = { request: { topic: value, segment: this.state.segment, clientId: clientId } };
    if (!mqttClient) {
      this.createClient(value);
    }
    else {
      mqttClient.subscribe('tcp/incoming/' + value, 2);
      mqttClient.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
    }

    //this.createClient(value);
  }

  onSegmentChange(value) {
    AsyncStorage.setItem('@SEGMENT', value.toString());
    if (interval) {
      window.clearInterval(interval);
    }
    if (subInterVal) {
      window.clearInterval(subInterVal);
    }
    this.setState({
      segment: value,
      loadding: true
    });

    let req = { request: { topic: this.state.selected1, segment: value, clientId: clientId } };
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
