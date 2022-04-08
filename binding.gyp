# 1. Select the file depends on your operating system.
# 2. Invoke the configure & build command: node-gyp configure && node-gyp build.
{
  "targets": [
    {
      "target_name": "binding",
      "sources": [ "./build/binding.vcxproj" ] # For Windows
      #"sources": [ "./build/binding.Makefile" ] # For Unix platforms 
    }
  ]
} 