# chatroom

chatroom，使用 Diffie-Hellman 协商密钥，AES 进行加密的，使用 protobuf 进行序列化/反序列化，基于 Socket 通信的聊天室的 Electron 应用

南邮信息安全综合实验 基于 Diffie-Hellman 的三方密钥交换算法

![example](https://github.com/ChenKS12138/chatroom/raw/main/image/example.gif)

# 实现原理

## 心跳包

每个 peer 定时发送心跳包，并接受心跳包维护自己的 uidsList

![heartbeat](https://github.com/ChenKS12138/chatroom/raw/main/image/heartbeat.png)

## 建立 Hub

建立 Broadcast Hub，抹平 Tcp Server 和 Tcp Client 的差异，统一所有实例为 peer，每个 peer 的行为都是对称的

![broadcast-hub](https://github.com/ChenKS12138/chatroom/raw/main/image/broadcast-hub.png)

## 密钥协商

基于 Diffie-Hellman 实现的密钥协商

![diffie-hellman](https://github.com/ChenKS12138/chatroom/raw/main/image/diffie-hellman.png)

## 消息加密通信

使用协商密钥作为 AES 加密的对称密钥，进行加密通信

![message-encryption](https://github.com/ChenKS12138/chatroom/raw/main/image/msssage-encryption.png)
