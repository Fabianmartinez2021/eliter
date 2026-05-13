/*eslint-disable*/
import React from "react";

// reactstrap components
import { Container } from "reactstrap";

function TransparentFooter() {
  return(
    <footer className="footer" style={{marginLeft:'70px'}}>
      <Container>
        {<nav>
          <div className="copyright" id="copyright">
            © {new Date().getFullYear()}, Diseñado por Eliter.{" "}
          </div>
          <div>
            Eliter · versión 2.1.7
          </div>
        </nav>}
      </Container>
    </footer>
  )    
}

export default TransparentFooter;
