This is a little tool that I needed so that I could point my laptop at an AWS
region running Elastic Load Balancing that was not yet in production, but
refer to that region by the public HTTPS domain name that it would eventually
be serving.

## Installing:

* `git clone git://github.com/jrgm/dnshook.git`

* `cd dnshook`

* Copy `config.json-dist` to `config.json` and edit that file to map the
  public domain name(s) to one (or more) ELB domain names.

* `npm install`

## Running:

* `./dnshook.js --help`:

```
    Remap DNS requests for some.host.tld to use a specific ELB in an AWS region
    
    Usage: node ./dnshook.js [options]
    
    Options:
      --help           display this usage message                                   
      --real-resolver  what resolver to use for domains we are not intercepting, or
                       for when we need to get the real answer  [default: "8.8.8.8"]
      --port           what port to bind                               [default: 53]
      --config-file    path/to/config.json                [default: "./config.json"]
      --logfile        path/to/logging.log                [default: "./logging.log"]
```

* change your DNS configuration to use 127.0.0.1 as the resolver. (See notes
  below on how to change this from the OSX command line).

* `sudo ./dnshook [options]`. Usually the defaults are what you need.

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


## Caveats:

1. I looked into port forwarding port 53 for localhost for osx, but couldn't
   find something that worked. So for now, this must be run as sudo. If anyone
   has a solution, let me know.

2. This is a test tool right now, so I don't recommend running it all the
   time. For now, change the resolver address, start this tool. When done,
   stop the tool and change your resolver back to the original value. (But I
   have used this as my resolver for hours at a time).

3. This is not compatible with using DNS addresses via a VPN.

## Notes:

1. The mapping can be an identity map. This repo was pushed to github when
   this code was remapping github.com to github.com
