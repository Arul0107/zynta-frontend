import React from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Flex, Spin } from "antd";
import "./CustomSpinner.css";

const CustomSpinner = ({ message = "Loading data...", fullscreen = false }) => {
  return (
    <div className={fullscreen ? "spinner-wrapper fullscreen" : "spinner-wrapper"}>
      <Flex align="center" vertical className="spinner-box">
       <Spin
  indicator={
    <LoadingOutlined
      style={{ fontSize: 50, color: "#4c066e" }} // change color here
      spin
    />
  }
  size="large"
/>
        <p className="spinner-text">{message}</p>
      </Flex>
    </div>
  );
};

export default CustomSpinner;
