import React from 'react';
import Section from 'components/Section';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Link from 'next/link';
import 'components/Footer.module.scss';

function Footer(props) {
  return (
    <Section
      bg={props.bg}
      textColor={props.textColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
      className="footer"
    >
      <Container>
        <Row>
          <Col xs={12} md={4}>
            <Link href="/" legacyBehavior>
              <a>
                <div>
                  <img
                    className="FooterComponent__logo"
                    src={props.logo}
                    alt="Logo"
                  ></img>
                </div>
              </a>
            </Link>

            {props.description && (
              <p className="FooterComponent__description">
                {props.description}
              </p>
            )}

            {props.copyright && (
              <p className="FooterComponent__copywrite">{props.copyright}</p>
            )}
          </Col>
          <Col xs={12} md={8} lg={{ span: 6, offset: 2 }}>
            <div className="FooterComponent__menus">
              <Row>
                <Col xs={12} md={4} className="mt-3 mt-md-0">
                  <h5>Product</h5>
                  <ul className="list-unstyled">
                    <li>
                      <Link href="/pricing" legacyBehavior>
                        <a>Pricing</a>
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" legacyBehavior>
                        <a>FAQ</a>
                      </Link>
                    </li>
                  </ul>
                </Col>
                <Col xs={12} md={4} className="mt-3 mt-md-0">
                  <h5>Company</h5>
                  <ul className="list-unstyled">
                    <li>
                      <Link href="/about" legacyBehavior>
                        <a>About</a>
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" legacyBehavior>
                        <a>Contact</a>
                      </Link>
                    </li>
                    <li>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://medium.com"
                      >
                        Blog
                      </a>
                    </li>
                  </ul>
                </Col>
                <Col xs={12} md={4} className="mt-3 mt-md-0">
                  <h5>Social</h5>
                  <ul className="list-unstyled">
                    <li>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://facebook.com"
                      >
                        <img
                          src="https://uploads.divjoy.com/icon-facebook.svg"
                          alt="Facebook"
                        ></img>
                        Facebook
                      </a>
                    </li>
                    <li>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://instagram.com"
                      >
                        <img
                          src="https://uploads.divjoy.com/icon-instagram.svg"
                          alt="Instagram"
                        ></img>
                        Instagram
                      </a>
                    </li>
                    <li>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://twitter.com"
                      >
                        <img
                          src="https://uploads.divjoy.com/icon-twitter.svg"
                          alt="Twitter"
                        ></img>
                        Twitter
                      </a>
                    </li>
                  </ul>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </Section>
  );
}

export default Footer;
