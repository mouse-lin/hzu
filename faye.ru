require 'faye'
require 'eventmachine'
require 'em-hiredis'

server = Faye::RackAdapter.new(:mount => '/faye', :timeout => 25)

EM.run {
  thin = Rack::Handler.get('thin')
  thin.run(server, :Port => 9292)
  
  server.get_client.subscribe('/control') do |msg|
    case msg['action']
    when 'join'
      server.get_client.publish('/chat', {'action' => 'control', 'user' => msg['user'], 'message' => 'joined the chat room'}) 
    when 'message'
      server.get_client.publish('/chat', msg)
    else
      # skip
    end
  end
}
