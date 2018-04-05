
import React, { PureComponent, Component } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Col, Row, Grid } from "react-native-easy-grid";
export default class FListItem extends Component {
    render() {
        const { dataItem } = this.props;
        let lineColor = dataItem.hightlight ? dataItem.hightlight.hightlightValue : "#e1e8af";
        return (
            <Row style={styles.row}>
                <Col style={{
                    paddingTop: 8, paddingBottom: 8, width: 90, borderWidth: 0.25,
                    borderColor: '#d6d7da', justifyContent: 'center'
                }}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.machine.machineName}</Text>
                </Col>
                <Col style={[styles.colBorder, { paddingTop: 8, paddingBottom: 8 }]}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.orders}</Text>
                </Col>
                <Col style={[styles.colBorder, { paddingTop: 8, paddingBottom: 8 }]}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.codeBtp}</Text>
                </Col>
                <Col style={[styles.colBorder, { paddingTop: 8, paddingBottom: 8 }]}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.corlor}</Text>
                </Col>
                <Col style={[styles.colBorder, { paddingTop: 8, paddingBottom: 8 }]}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.denier}</Text>
                </Col>
                <Col style={[styles.colBorder, { paddingTop: 8, paddingBottom: 8 }]}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.plan}</Text>
                </Col>
                <Col style={[styles.colBorder, { paddingTop: 8, paddingBottom: 8 }]}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.produced}</Text>
                </Col>
                <Col style={[styles.colBorder, { paddingTop: 8, paddingBottom: 8 }]}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.remain}</Text>
                </Col>
                <Col style={{
                    paddingTop: 8, paddingBottom: 8, width: 100, borderWidth: 0.25,
                    borderColor: '#d6d7da', justifyContent: 'center'
                }}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.productDate}</Text>
                </Col>
                <Col style={{
                    paddingTop: 8, paddingBottom: 8, width: 100, borderWidth: 0.25,
                    borderColor: '#d6d7da', justifyContent: 'center'
                }}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.finishDate}</Text>
                </Col>
                <Col style={{
                    paddingTop: 8, paddingBottom: 8, width: 100, borderWidth: 0.25,
                    borderColor: '#d6d7da', justifyContent: 'center'
                }}>
                    <Text style={[styles.text, { color: lineColor }]}>{dataItem.releaseDate}</Text>
                </Col>
            </Row>
        )
    }
}
const styles = StyleSheet.create({

    colBorder: {
        borderWidth: 0.25,
        borderColor: '#d6d7da',
        justifyContent: 'center'
    },
    head: { minHeight: 50, backgroundColor: '#f1f8ff' },
    text: { marginLeft: 5, textAlign: 'center', },
    row: { height: 70},
    text: { fontWeight: "400", fontSize: 18, textAlign: 'center' }
});