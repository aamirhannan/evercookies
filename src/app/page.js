"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { handleSetEvercookie, handleGetEvercookie } from "../utils/tracker";
import { v4 as uuidv4 } from "uuid";
import { useEffect } from "react";



export default function Home() {

  useEffect(() => {
    handleSetEvercookie("test", uuidv4());
  }, []);

  return (
    <div>
      <h1>Evercookies</h1>
      {/* <button onClick={() => handleSetEvercookie("test", uuidv4())}>Set Evercookie</button> */}
      <button onClick={async () => {
        const value = await handleGetEvercookie("test");
        console.log("Evercookie value:", value);
      }}
      >
        Get Evercookie
      </button>
    </div>

  );
}
