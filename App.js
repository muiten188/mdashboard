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
  AsyncStorage
} from 'react-native';
import { Picker, Item, Label, Spinner, Badge } from 'native-base';
import FListItem from './listItem';
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
export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      tableData: [],
      arrayShow: [],
      selected1: 'LCD001',
      loadding: true,
      newMessage: false,
      change: 0
    }

  }

  componentDidMount() {
    // AsyncStorage.getItem("@tableData").then((value) => {
    //   if (value) {

    //     const msgObj = JSON.parse(value);
    //     const tableData = msgObj.data;
    //     interval = window.setInterval(() => {
    //       const arrayShow = tableData.slice(currentSlice, endSilce);
    //       currentSlice = currentSlice + numberRow;
    //       endSilce = endSilce + numberRow;
    //       if (currentSlice >= tableData.length) {
    //         currentSlice = 0;
    //         endSilce = 5;
    //       }
    //       this.setState({
    //         arrayShow: arrayShow,
    //         loadding: false
    //       })
    //     }, 2000)
    //   }
    // }).catch(() => { debugger; })
    this.createClient(this.state.selected1);
  }

  createClient(topic) {
    /* create mqtt client */
    mqtt.createClient({
      uri: 'tcp://113.171.23.202:1883',
      clientId: 'tcp/incoming/' + topic + "/" + guid()
    }).then((client) => {
      mqttClient = client;
      client.on('closed', function () {
        alert('kết nối đến server đã đóng');

      });
      client.on('error', function (msg) {
        alert('Lỗi: ', msg);
      });

      client.on('message', this.onMessageMqtt.bind(this));

      let req = { request: { topic: topic } };

      client.on('connect', function () {
        //alert('connected');
        client.subscribe('tcp/incoming/' + topic, 2);
        client.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
      });

      client.connect();
    }).catch(function (err) {
      debugger;
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
    if (interval) {
      window.clearInterval(interval);
    }
    if (subInterVal) {
      window.clearInterval(subInterVal);
    }
    const objTableData = this.bindArrMachine(tableData);
    subInterVal = window.setInterval(() => {
      console.log('change array');
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
          if (objTableData.arrSingleMachine.indexOf(item) > -1) {
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
    }, 1500);
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
    }, 6000)
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
    const { tableData, arrayShow, newMessage } = this.state;
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        {this.state.loadding ? <View style={{
          position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, justifyContent: 'center',
          alignItems: 'center', zIndex: 99999
        }}>
          <Spinner size={60} />
        </View> : null}
        <Item>
          <Label style={{ color: '#fefefe', fontSize: 24, marginLeft: 6, marginRight: 6 }}>Màn hình</Label>
          <Picker
            style={{ width: 200, height: 40, color: 'red' }}
            itemTextStyle={{ fontSize: 12, color: 'yellow' }}
            iosHeader="Select one"
            mode="dropdown"
            selectedValue={this.state.selected1}
            onValueChange={this.onValueChange.bind(this)}
          >
            {
              ["LCD001", "LCD004"].map((item, index) => {
                return (<Item key={index} label={item} value={item} />)
              })
            }
          </Picker>
          {newMessage ?
            <Badge style={{
              backgroundColor: '#00A000', position: 'absolute',
              right: 6, justifyContent: 'center', marginTop: 6
            }}>
              <Text style={{ fontSize: 22 }}>Dữ liệu mới nhận</Text>
            </Badge> : null}
        </Item>

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
    let req = { request: { topic: value } };
    if (!mqttClient) {
      this.createClient(value);
    }
    else {
      mqttClient.subscribe('tcp/incoming/' + value, 2);
      mqttClient.publish('tcp/outgoing/request', JSON.stringify(req), 2, false);
    }

    //this.createClient(value);
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
  head: { minHeight: 50, backgroundColor: '#f1f8ff' },
  text: { marginLeft: 5, textAlign: 'center' },
  row: { height: 50 },
  text: { color: 'red', fontSize: 22, textAlign: 'center' }
});
