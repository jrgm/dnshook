This is a little tool that I needed so that I could point my laptop at an AWS
region running Elastic Load Balancing that was not yet in production, but
refer to that region by the public HTTPS domain name that it would eventually
be serving.

## Installing:

* `git clone git://github.com/jrgm/dnshook.git`

* `cd dnshook`

* `npm install`

* Copy `config.json-dist` to `config.json` and edit that file to map the
  public domain name(s) to one (or more) ELB domain names.

## Running:

* `./dnshook.js --help`:

```
    Remap DNS requests for some.host.tld to use a specific ELB in an AWS region
    Usage: node ./dnshook.js [options]
    
    Options:
      --help, -h           display this usage message                               
      --real-resolver, -r  what resolver to use for domains we are not
                           intercepting, or for when we need to get the real answer
                                                                [default: "8.8.8.8"]
      --port, -P           what port to bind                           [default: 53]
      --config-file, -c    path/to/config.json            [default: "./config.json"]
      --logfile, -l        path/to/logging.log            [default: "./logging.log"]
```

* change your DNS configuration to use 127.0.0.1 as the resolver. (See notes
  below on how to change this on OSX, Windows, and Linux. If you're using
  VMWare Fusion, you only need to make the change to OSX use a localhost
  resolver, and the VMs will use that resolver too).

* `sudo ./dnshook.js [options]`. Usually the defaults are what you need.

* Logging will go both to the console, and to the `--logfile`

## How to change the OSX resolver address from the command line:

### List the available interfaces (you probably want the wireless one):

    $ networksetup -listallnetworkservices
      Ethernet
      Wi-Fi
      iPhone USB

### List your current dns server(s).
    
    $ sudo networksetup -getdnsservers Wi-Fi
    
### Set it to where you want, e.g.:

    $ sudo networksetup -setdnsservers Wi-Fi 127.0.0.1

### Set it back to default:

    $ sudo networksetup -setdnsservers Wi-Fi <your original resolver list>

    $ sudo networksetup -setdnsservers Wi-Fi empty

    Note: type the above line exactly (i.e., 'empty' doesn't mean '')


## How to change the Windows resolver address from the not-command-line:

- `https://developers.google.com/speed/public-dns/docs/using` (but use 127.0.0.1, not 8.8.*.*)

- `http://mintywhite.com/windows-7/change-dns-server-windows-7`

## How to change the Linux resolver address:

- `/etc/resolv.conf`

## Caveats:

1. I looked into port forwarding port 53 for localhost for osx, but couldn't
   find something that worked. So for now, this must be run as sudo. If anyone
   has a solution, let me know.

2. This is a test tool right now, so I don't recommend running it all the
   time. For now, change the resolver address, start this tool. When done,
   stop the tool and change your resolver back to the original value. (But I
   have used this as my resolver for days at a time (modulu the next point)).

3. This is not compatible with using DNS addresses via a VPN.

## Notes:

1. The mapping can be an identity map. This repo was pushed to github when
   this code was remapping github.com to github.com.
