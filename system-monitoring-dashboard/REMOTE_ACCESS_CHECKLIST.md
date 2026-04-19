# Remote Access Checklist

Use this before leaving home.

1. Start Tailscale on the PC.
2. Start Tailscale on the phone.
3. Start the dashboard with `start-dashboard.bat` or `npm run remote`.
4. On the PC, open `http://localhost:3000`.
5. On the PC, open `http://100.110.5.104:3000`.
6. On the phone, with Tailscale connected, open `http://100.110.5.104:3000`.
7. If the page opens but stats do not update, open `http://100.110.5.104:4000/api/stats`.

If step 4 fails, the dashboard is not running.
If step 4 works but step 5 fails, Windows Firewall is probably blocking port 3000 or 4000.
If step 5 works but step 6 fails, the phone is probably not connected to the same Tailscale network.

Recommended Windows Firewall rules, run PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "Retro Monitor Web 3000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
New-NetFirewallRule -DisplayName "Retro Monitor API 4000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4000
```
