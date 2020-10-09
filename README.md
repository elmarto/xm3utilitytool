# SONY XM3 UTILITY TOOL

This utility allows to force firmware downgrade, force installing latest firmware or change headphones region.

```
This project is a translation from lzgzr's project, inspired by rotala5540 and feeded by FormalDetail5 dumps.
```

### PLEASE CONSIDER THAT ANY DAMAGE CAUSED IN YOUR HEADPHONE IS UNDER YOUR RESPONSABILITY. 
## DO AT YOUR OWN RISK


## How to Downgrade to 2.0.0
1. Clone or download this repository (Tested only on Windows 10)

2. Install Node.js. Open a command line. Go to this project root and run `npm run start`.

3. To downgrade to 2.0.0 select Force Flash Custom Firmware (option 3) and select `custom_fw.bin` (it's just the filename, not really a custom firmware).

4. Ensure any firewalls are off or allow port 8848 through. Your PC and phone must be on the same network

5. Figure out the IP address of your PC on your local network. You can use "ipconfig" on Windows to do that

6. In your phone wifi settings, set up the HTTP proxy. Set its host to your PC IP address and the port to 8848

7. Setup proxy in your phone

    - Android: Settings -> Network -> Wi-Fi -> Hold on your home network name -> Modify network -> Proxy: select "Manual" -> Proxy hostname: enter your PC IP, Proxy port: enter 8848 -> Save

    - iOS: Settings -> Wi-Fi -> click info circle -> HTTP Proxy -> Configure Proxy: Manual -> Server: Your PC IP -> Port: 8848

8. Open the Sony Headphones Connect app v4.1. It should notify you that a new update is available